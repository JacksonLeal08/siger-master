'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { useSpci } from '../context/SpciContext';
import { 
  Key, 
  Mail, 
  AlertTriangle, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  CheckSquare, 
  Square,
  ShieldCheck,
  Flame,
  Truck,
  Radio,
  HeartPulse
} from 'lucide-react';
import LegalPolicyModal, { PolicyModalType } from '../components/legal/LegalPolicyModal';
import { SYSTEM_VERSION, COMPANY_NAME, COPYRIGHT_YEAR } from '../config/version';
import { supabase } from '@/lib/supabaseClient';

// Mensagens dinâmicas de conexão segura
const statusMessages = [
  'Validando chaves criptográficas TLS 1.3...',
  'Resolvendo endpoint de banco de dados SIGER...',
  'Mapeando políticas de Row Level Security (RLS)...',
  'Autenticando credenciais no cofre de segurança...',
  'Iniciando handshake seguro com o servidor...',
  'Sincronizando cache local de prontidão...',
  'Concedendo privilégios de acesso ao Cockpit...',
  'Acesso autorizado. Bem-vindo ao SIGER Master!'
];

export default function LoginClient() {
  const router = useRouter();
  const { 
    currentUser, 
    userProfile,
    handleCredentialsLogin,
    handleSystemLogout
  } = useSpci();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Modal de Recuperação de Senha
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados de Operação e Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectedRef = useRef(false);

  // Modal de Políticas Legais (Privacidade e Termos via React Portal)
  const [legalModalType, setLegalModalType] = useState<PolicyModalType>(null);

  // Tratamento de parâmetros de sessão e prevenção de loops de redirecionamento
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('unauthorized') === '1') {
        if (typeof document !== 'undefined') {
          document.cookie = 'spci_session_token=; path=/; max-age=0';
          document.cookie = 'spci_user_role=; path=/; max-age=0';
          document.cookie = 'spci_user_expires=; path=/; max-age=0';
        }
      }
    }
  }, []);

  // Capturar e tratar erros de links de e-mail expirados / hash de autenticação
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      if (hash.includes('error=') || hash.includes('otp_expired') || hash.includes('invalid')) {
        setErrorMsg('O link de e-mail expirou ou é inválido. Por favor, utilize suas credenciais corporativas.');
        window.history.replaceState(null, '', window.location.pathname);
      } else if (hash.includes('type=recovery')) {
        setShowForgotModal(true);
        setForgotMsg({ type: 'success', text: 'Link de recuperação identificado! Digite seu e-mail para definir a nova senha.' });
        window.history.replaceState(null, '', window.location.pathname);
      } else if (hash.includes('type=signup') || hash.includes('access_token')) {
        router.push('/dashboard' + hash);
      }
    }
  }, [router]);

  // Simulação de progresso criptográfico de autenticação
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let messageInterval: NodeJS.Timeout;

    if (loading) {
      setProgress(0);
      setLoadingStatus(statusMessages[0]);

      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          const step = Math.floor(Math.random() * 10) + 6;
          return Math.min(prev + step, 100);
        });
      }, 140);

      let currentMsgIndex = 0;
      messageInterval = setInterval(() => {
        if (currentMsgIndex < statusMessages.length - 1) {
          currentMsgIndex++;
          setLoadingStatus(statusMessages[currentMsgIndex]);
        }
      }, 380);

      return () => {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
      };
    }
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const result = await handleCredentialsLogin(identifier, password);
      if (result) {
        setProgress(100);
        setLoadingStatus('Acesso autorizado! Conectando ao Cockpit...');
        redirectedRef.current = true;
        setIsRedirecting(true);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 220);
      } else {
        setLoading(false);
        setErrorMsg('Credenciais inválidas. Verifique seu usuário e senha corporativos.');
      }
    } catch (err: any) {
      setLoading(false);
      const raw = String(err?.message || '');
      if (
        raw.toLowerCase().includes('failed to fetch') ||
        raw.toLowerCase().includes('fetch failed') ||
        raw.toLowerCase().includes('networkerror') ||
        raw.toLowerCase().includes('enotfound')
      ) {
        setErrorMsg('Não foi possível conectar ao banco de dados Supabase. Verifique a conexão com a internet.');
      } else {
        setErrorMsg(raw || 'Erro ao efetuar autenticação corporativa.');
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        setForgotMsg({ type: 'error', text: error.message || 'Falha ao enviar e-mail de redefinição.' });
      } else {
        setForgotMsg({ type: 'success', text: 'E-mail de redefinição enviado! Verifique sua caixa de entrada.' });
      }
    } catch {
      setForgotMsg({ type: 'error', text: 'Ocorreu um erro ao processar a solicitação.' });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div 
      translate="no"
      className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-zinc-950 font-sans select-none"
    >
      {/* 1. PLANO DE FUNDO FOTOGRÁFICO REALISTA MULTIDOMÍNIO */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0 transform scale-[1.01] transition-transform duration-1000 ease-out"
        style={{ backgroundImage: `url('/login-bg.png')` }}
      />

      {/* Degradê de Vinheta & Proteção de Contraste Glass */}
      <div className="fixed inset-0 z-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/70 to-zinc-950/85 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/60 pointer-events-none" />

      {/* 2. CONTEÚDO PRINCIPAL (SPLIT DESKTOP / FLUIDO MOBILE) */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row w-full max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-12 items-center justify-between gap-10 lg:gap-14">
        
        {/* LADO ESQUERDO: COMANDO UNIFICADO & NARRATIVA INSTITUCIONAL */}
        <div className="w-full lg:w-[58%] flex flex-col justify-between space-y-8 text-left">
          
          {/* Cabeçalho de Marca: Logo JIMMP Info + Identificação do Sistema */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="p-0 bg-transparent">
              <Image 
                src="/assets/branding/logo-jimmp-info.png" 
                alt="Logo JIMMP Info" 
                width={200}
                height={60}
                priority
                className="h-12 sm:h-14 md:h-16 w-auto object-contain brightness-110 drop-shadow-[0_4px_16px_rgba(104,211,70,0.35)] transition-transform hover:scale-105" 
              />
            </div>
            <div className="border-l border-zinc-700/80 pl-4 py-1">
              <span className="text-[10px] font-black text-[#68D346] tracking-[0.25em] block uppercase leading-none font-mono">
                ECOSSISTEMA OFICIAL
              </span>
              <span className="text-sm sm:text-base font-black text-white tracking-wider leading-none mt-1 font-['Hanken_Grotesk'] block">
                SIGER MASTER
              </span>
            </div>
          </div>

          {/* Slogan & Comunicação Institucional (Idêntico à Home Page) */}
          <div className="space-y-5 max-w-2xl">
            {/* Tag de Missão Crítica */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-[#68D346]/40 text-[#B7F365] text-[10.5px] font-mono font-bold tracking-widest backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#68D346] animate-pulse shadow-[0_0_8px_#68D346]" />
              <span className="uppercase">SIGER MASTER • SISTEMA INTEGRADO DE GESTÃO DE EMERGÊNCIA & RESGATE</span>
            </div>

            {/* Slogan Principal */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[44px] xl:text-5xl font-black text-white uppercase tracking-tight leading-[1.12] font-['Hanken_Grotesk']">
              COMANDO UNIFICADO DE EMERGÊNCIA, RESGATE E{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#68D346] via-[#85e865] to-[#B7F365] drop-shadow-[0_0_20px_rgba(104,211,70,0.35)]">
                PRONTIDÃO OPERACIONAL
              </span>
            </h1>

            {/* Subtítulo Institucional */}
            <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
              Plataforma integrada de inteligência e prontidão para Gestão de Ativos de Prevenção, Frotas Táticas, Central de Despacho (CAD) e Atendimento Pré-Hospitalar (APH).
            </p>

            {/* Chips dos 4 Pilares Operacionais */}
            <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-mono text-zinc-200">
              <div className="px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-700/60 backdrop-blur-md flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-[#68D346]" />
                <span>SPCI 100% Auditado</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-700/60 backdrop-blur-md flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-[#68D346]" />
                <span>Frotas 4x4 em Prontidão</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-700/60 backdrop-blur-md flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-[#68D346]" />
                <span>Despacho CAD em Tempo Real</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-700/60 backdrop-blur-md flex items-center gap-2">
                <HeartPulse className="w-3.5 h-3.5 text-[#68D346]" />
                <span>ePCR Prontuário Clínico</span>
              </div>
            </div>
          </div>

          {/* Assinatura Operacional no Rodapé do Painel Esquerdo */}
          <div className="pt-2 text-[11px] font-mono text-zinc-400 tracking-wider">
            BASE OPERACIONAL INTEGRADA // PARAUAPEBAS-PA • JIMMP INFO
          </div>
        </div>

        {/* LADO DIREITO: CARD DE CREDENCIAIS EM DARK FROSTED GLASS */}
        <div className="w-full lg:w-[42%] flex justify-center">
          <div 
            className="w-full max-w-md rounded-3xl p-7 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_25px_-5px_rgba(104,211,70,0.15)] relative z-20 backdrop-blur-2xl transition-all"
            style={{
              background: 'rgba(24, 24, 27, 0.65)',
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              borderTop: '1px solid rgba(213, 217, 220, 0.28)',
            }}
          >
            {/* Header interno do Card de Login */}
            <div className="space-y-1.5 text-left mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-wide font-['Hanken_Grotesk']">
                  Acessar Cockpit
                </h2>
                <span className="w-2.5 h-2.5 rounded-full bg-[#68D346] shadow-[0_0_8px_#68D346] animate-pulse" />
              </div>
              <p className="text-xs text-zinc-400 font-sans">
                Entre com suas credenciais corporativas do ecossistema SIGER.
              </p>
            </div>

            {/* Card de Sessão Ativa / Troca Rápida de Conta */}
            {currentUser && (
              <div className="mb-6 bg-zinc-900/80 border border-[#68D346]/40 p-4 rounded-2xl space-y-3 text-left shadow-sm backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#B7F365] text-xs font-bold font-mono">
                    <span className={`w-2.5 h-2.5 rounded-full bg-[#68D346] shrink-0 ${isRedirecting ? 'animate-ping' : 'animate-pulse'}`} />
                    <span>{isRedirecting ? 'REDIRECIONANDO AO COCKPIT...' : 'SESSÃO ATIVA DETECTADA'}</span>
                  </div>
                  <span className="text-[9px] font-black uppercase bg-[#1C4E26] text-[#B7F365] border border-[#68D346]/40 px-2 py-0.5 rounded-md font-mono">
                    {userProfile?.role || 'Conectado'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                  Conectado como <strong className="font-mono text-white">{userProfile?.name || currentUser.displayName || currentUser.email}</strong> ({currentUser.email}).
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      redirectedRef.current = true;
                      setIsRedirecting(true);
                      window.location.href = '/dashboard';
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#1C4E26] to-[#246831] hover:from-[#246831] hover:to-[#2e7d3d] text-[#B7F365] border border-[#68D346]/50 font-black text-[10.5px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span>{isRedirecting ? 'Entrando...' : 'Ir ao Cockpit'}</span> <ArrowRight className="w-3.5 h-3.5 text-[#B7F365]" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsRedirecting(false);
                      await handleSystemLogout();
                      setIdentifier('');
                      setPassword('');
                      if (typeof window !== 'undefined') {
                        const url = new URL(window.location.href);
                        url.searchParams.set('switch', 'true');
                        window.history.replaceState(null, '', url.toString());
                      }
                    }}
                    className="flex-1 py-2.5 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-zinc-700 active:scale-95"
                  >
                    Trocar Conta 🔄
                  </button>
                </div>
              </div>
            )}

            {/* Mensagem de Erro com Alto Contraste */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-5 bg-red-950/70 border border-red-500/60 p-3.5 flex gap-3 text-red-300 rounded-xl backdrop-blur-md text-left"
                >
                  <AlertTriangle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                  <div className="text-[11px] font-bold leading-normal">
                    <p className="uppercase text-red-200">Falha de Autenticação</p>
                    <p className="font-sans font-medium mt-0.5 text-zinc-300">{errorMsg}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Formulário de Login */}
            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              {/* Campo Usuário / E-mail */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="identifier" 
                  className="block text-[11px] font-bold uppercase text-zinc-300 tracking-wider font-mono"
                >
                  Usuário ou E-mail
                </label>
                <div className="relative group/input">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 group-focus-within/input:text-[#68D346] transition-colors">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="usuario ou email@empresa.com"
                    className="w-full bg-zinc-900/80 border border-white/10 focus:border-[#68D346] focus:ring-2 focus:ring-[#68D346]/25 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all duration-300 font-bold"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="password" 
                  className="block text-[11px] font-bold uppercase text-zinc-300 tracking-wider font-mono"
                >
                  Senha de Acesso
                </label>
                <div className="relative group/input">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 group-focus-within/input:text-[#68D346] transition-colors">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-900/80 border border-white/10 focus:border-[#68D346] focus:ring-2 focus:ring-[#68D346]/25 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all duration-300 font-bold"
                  />
                  {password.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-[#68D346] transition-colors border-none bg-transparent cursor-pointer"
                      aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 text-[#68D346]" /> : <Eye className="w-4 h-4 text-zinc-400" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Opções: Lembrar de mim & Esqueci a Senha */}
              <div className="flex items-center justify-between text-[11.5px] font-sans">
                <label className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer select-none transition-colors">
                  <input 
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  {rememberMe ? (
                    <CheckSquare className="w-4 h-4 text-[#68D346]" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-500" />
                  )}
                  <span>Permanecer conectado</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setForgotMsg(null);
                    setForgotEmail(identifier.includes('@') ? identifier : '');
                    setShowForgotModal(true);
                  }}
                  className="text-[#68D346] hover:text-[#B7F365] font-semibold transition-colors border-none bg-transparent cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>

              {/* Botão de Submissão Principal (Paleta Cyber Verde JIMMP Info) */}
              <button
                type="submit"
                className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-[#1C4E26] via-[#246831] to-[#1C4E26] hover:from-[#246831] hover:to-[#2e7d3d] text-white border border-[#68D346]/60 font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(104,211,70,0.35)] hover:shadow-[0_0_30px_rgba(183,243,101,0.55)] transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="text-[#B7F365]">ENTRAR NO COCKPIT</span>
                <ArrowRight className="w-4 h-4 text-[#B7F365]" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. RODAPÉ EXECUTIVO & LINKS LEGAIS SEM ESTOURO DE PÁGINA */}
      <footer className="relative z-10 w-full py-4 px-6 border-t border-white/10 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] font-mono text-zinc-400">
          {/* Direitos Autorais Oficiais */}
          <div className="text-center sm:text-left">
            <p className="tracking-wide">
              © {COPYRIGHT_YEAR} - Todos os direitos reservados <span className="mx-1 text-[#68D346] font-bold">|</span>{' '}
              <span className="font-bold text-zinc-200">{COMPANY_NAME}</span>
            </p>
          </div>

          {/* Links Legais Desacoplados (Renderizados via React Portal) */}
          <div className="flex items-center gap-3 text-[11px]">
            <button
              type="button"
              onClick={() => setLegalModalType('privacy')}
              className="text-zinc-400 hover:text-[#68D346] transition-colors cursor-pointer bg-transparent border-none p-0 focus:outline-none"
            >
              Privacidade
            </button>
            <span className="text-zinc-600">•</span>
            <button
              type="button"
              onClick={() => setLegalModalType('terms')}
              className="text-zinc-400 hover:text-[#68D346] transition-colors cursor-pointer bg-transparent border-none p-0 focus:outline-none"
            >
              Termos
            </button>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="text-[10px] text-zinc-500 hidden sm:inline font-mono">
              {SYSTEM_VERSION}
            </span>
          </div>
        </div>
      </footer>

      {/* 4. MODAL DE RECUPERAÇÃO DE SENHA EM DARK GLASS */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-5 text-white"
              style={{
                background: 'rgba(24, 24, 27, 0.92)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderTop: '1px solid rgba(213, 217, 220, 0.35)',
              }}
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold uppercase text-white tracking-wider flex items-center gap-2 font-mono">
                  <Key className="w-4 h-4 text-[#68D346]" />
                  Recuperar Acesso Corporativo
                </h3>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="text-zinc-400 hover:text-white text-sm cursor-pointer border-none bg-transparent"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-zinc-300 font-sans leading-relaxed text-left">
                Informe o seu e-mail corporativo cadastrado para receber as instruções seguras de redefinição de senha.
              </p>

              {forgotMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-sans font-medium text-left ${
                    forgotMsg.type === 'success'
                      ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                      : 'bg-red-950/60 border border-red-500/50 text-red-300'
                  }`}
                >
                  {forgotMsg.text}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label htmlFor="forgot-email" className="block text-[10.5px] font-bold uppercase text-zinc-300 tracking-wider font-mono">
                    E-mail Cadastrado
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="seu.email@empresa.com"
                    className="w-full bg-zinc-900 border border-white/15 focus:border-[#68D346] focus:ring-2 focus:ring-[#68D346]/25 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all font-bold"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold uppercase border border-zinc-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 bg-gradient-to-r from-[#1C4E26] to-[#246831] hover:from-[#246831] hover:to-[#2e7d3d] border border-[#68D346]/50 text-[#B7F365] rounded-xl text-xs font-bold uppercase cursor-pointer transition-all shadow-md disabled:opacity-50"
                  >
                    {forgotLoading ? 'Enviando...' : 'Enviar Instruções'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. LOADING OVERLAY INTERATIVO (ESCUDO NEON VERDE JIMMP INFO) */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/95 z-[99999] flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="max-w-md w-full space-y-8 relative">
              {/* Escudo Pulsante Neon */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.08, 1],
                    boxShadow: [
                      '0 0 20px rgba(104,211,70,0.2), inset 0 0 15px rgba(104,211,70,0.2)',
                      '0 0 35px rgba(104,211,70,0.5), inset 0 0 25px rgba(104,211,70,0.4)',
                      '0 0 20px rgba(104,211,70,0.2), inset 0 0 15px rgba(104,211,70,0.2)'
                    ]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-20 h-20 bg-zinc-900 border-2 border-[#68D346] rounded-full flex items-center justify-center shadow-lg relative"
                >
                  <ShieldCheck className="w-10 h-10 text-[#68D346] drop-shadow-[0_0_8px_rgba(104,211,70,0.6)]" />
                </motion.div>
              </div>

              {/* Indicador de Status */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase text-white tracking-widest font-mono">
                  ESTABELECENDO ACESSO SEGURO
                </h3>
                <div className="h-6 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingStatus}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="text-[11px] text-[#B7F365] font-mono font-bold uppercase tracking-wider"
                    >
                      {loadingStatus}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              {/* Barra de Progresso Neon */}
              <div className="w-full max-w-xs mx-auto">
                <div className="h-1.5 bg-zinc-900 border border-zinc-800 relative w-full overflow-hidden rounded-full">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#1C4E26] via-[#68D346] to-[#B7F365] shadow-[0_0_10px_rgba(104,211,70,0.8)]"
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeOut", duration: 0.2 }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9.5px] font-mono text-zinc-400 font-bold uppercase mt-2 px-1">
                  <span>SIGER MASTER PROTOCOL</span>
                  <span className="text-[#68D346]">{progress}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. MODAL LEGAL DESACOPLADO VIA REACT PORTAL (PRIVACIDADE E TERMOS) */}
      <LegalPolicyModal
        isOpen={!!legalModalType}
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
}
