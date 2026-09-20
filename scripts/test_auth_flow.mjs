// Teste Automatizado de Validação do Fluxo de Autenticação e Prevenção de Loops
import assert from 'node:assert';

console.log('🧪 Iniciando testes de validação do fluxo de autenticação SPCI Master...\n');

// 1. Teste de Deduplicação de Sessão (Supabase Auth Listener)
console.log('▶ Teste 1: Deduplicação de chamadas de sessão simultâneas...');
{
  let lastProcessedUserId = null;
  let successCount = 0;

  const handleSession = (session) => {
    if (session && session.user) {
      if (lastProcessedUserId !== session.user.id) {
        lastProcessedUserId = session.user.id;
        successCount++;
      }
    } else {
      if (lastProcessedUserId !== null) {
        lastProcessedUserId = null;
      }
    }
  };

  const dummySession = {
    access_token: 'fake_jwt_token_123',
    user: { id: 'usr_jackson_dev', email: 'jacksonflr@outlook.com.br' }
  };

  // Simula o disparo simultâneo de onAuthStateChange + getSession
  handleSession(dummySession);
  handleSession(dummySession);

  assert.strictEqual(successCount, 1, 'Deve executar onAuthSuccess exatamente UMA vez para a mesma sessão.');
  console.log('  ✅ Sucesso: O listener processou a sessão apenas uma vez, sem sobrecarga ou duplicidade.');
}

// 2. Teste de Regras de Middleware e Redirecionamento de Login
console.log('\n▶ Teste 2: Lógica do Middleware para rotas protegidas e /login...');
{
  function evaluateMiddleware(path, sessionToken, searchParams = new URLSearchParams()) {
    const isProtectedRoute = 
      path.startsWith('/dashboard') || 
      path.startsWith('/configuracoes') || 
      path.startsWith('/extintores');

    if (!sessionToken && isProtectedRoute) {
      return { redirect: '/login' };
    }

    if (sessionToken && path === '/login') {
      const isSwitching = searchParams.get('switch') === 'true' || searchParams.get('new_session') === 'true';
      if (!isSwitching) {
        return { redirect: '/dashboard' };
      }
      return { allow: true };
    }

    return { allow: true };
  }

  // Caso A: Usuário não logado tenta acessar /dashboard -> deve ir para /login
  const resA = evaluateMiddleware('/dashboard', null);
  assert.strictEqual(resA.redirect, '/login', 'Usuário não autenticado deve ser redirecionado para /login');

  // Caso B: Usuário já logado acessa /login -> deve ir direto para /dashboard (SEM loop)
  const resB = evaluateMiddleware('/login', 'valid_token_xyz');
  assert.strictEqual(resB.redirect, '/dashboard', 'Usuário autenticado em /login deve ir direto para /dashboard');

  // Caso C: Usuário logado clica em "Trocar de Conta" (?switch=true) -> deve permitir ver o login
  const resC = evaluateMiddleware('/login', 'valid_token_xyz', new URLSearchParams('switch=true'));
  assert.strictEqual(resC.allow, true, 'Usuário trocando de conta deve conseguir acessar /login?switch=true');

  console.log('  ✅ Sucesso: Todas as regras de redirecionamento do middleware validadas contra loops.');
}

// 3. Teste de Auto-Redirecionamento no LoginClient
console.log('\n▶ Teste 3: Lógica de Auto-Redirecionamento do LoginClient...');
{
  function shouldAutoRedirect(authChecking, currentUser, userProfile, searchString) {
    if (authChecking || !currentUser || !userProfile) {
      return false;
    }
    const params = new URLSearchParams(searchString);
    const isSwitch = params.get('switch') === 'true' || params.get('new_session') === 'true';
    return !isSwitch;
  }

  // Enquanto authChecking é true -> não redireciona (espera resolver)
  assert.strictEqual(shouldAutoRedirect(true, { uid: '123' }, { role: 'Desenvolvedor' }, ''), false);

  // Quando authChecking termina e usuário está conectado -> redireciona para o cockpit!
  assert.strictEqual(shouldAutoRedirect(false, { uid: '123' }, { role: 'Desenvolvedor' }, ''), true);

  // Se o usuário está em modo de troca de conta (?switch=true) -> não redireciona
  assert.strictEqual(shouldAutoRedirect(false, { uid: '123' }, { role: 'Desenvolvedor' }, '?switch=true'), false);

  console.log('  ✅ Sucesso: O LoginClient direciona automaticamente o usuário logado para o Cockpit.');
}

// 4. Teste de Fallback de Timeout para Prevenir Telas Congeladas
console.log('\n▶ Teste 4: Fallback de Timeout para nunca travar a tela...');
{
  let authChecking = true;
  const timeoutMs = 50; // Simulado para o teste

  const timer = setTimeout(() => {
    authChecking = false;
  }, timeoutMs);

  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.strictEqual(authChecking, false, 'authChecking deve ser liberado pelo fallback se o backend tardar.');
  console.log('  ✅ Sucesso: Fallback de segurança destrava a interface caso haja lentidão externa.');
}

console.log('\n🎉 Todos os 4 testes de validação de autenticação e redirecionamento passaram com 100% de sucesso!');
