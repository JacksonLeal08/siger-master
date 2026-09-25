'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LegalPolicyModal, { PolicyModalType } from '../legal/LegalPolicyModal';
import { SYSTEM_VERSION, COMPANY_NAME, COPYRIGHT_YEAR } from '@/config/version';
import { ShieldCheck, Smartphone, ExternalLink, ArrowRight } from 'lucide-react';

interface FooterProps {
  className?: string;
  variant?: 'full' | 'compact';
}

export default function Footer({ className = '', variant = 'full' }: FooterProps) {
  const [modalPolicy, setModalPolicy] = useState<PolicyModalType>(null);

  return (
    <>
      <footer className={`w-full bg-[#121316] dark:bg-zinc-950 border-t border-zinc-800/80 text-zinc-400 font-mono select-none relative z-20 ${className}`}>
        {variant === 'full' ? (
          <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 lg:py-16">
            
            {/* Top Brand Grid: Logo + Descrição Institucional */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12 border-b border-zinc-800/70">
              
              {/* Coluna 1 & 2: Identidade JIMMP Info & SIGER Master */}
              <div className="lg:col-span-5 space-y-4 text-left">
                <div className="flex items-center gap-4">
                  <div className="relative py-1.5 px-3 rounded-2xl bg-gradient-to-r from-zinc-900 to-[#1E2024] border border-[#3C3F45] shadow-[0_0_15px_rgba(104,211,70,0.12)] flex items-center justify-center">
                    <Image 
                      src="/assets/branding/logo-jimmp-info.png" 
                      alt="Logo JIMMP Info" 
                      width={160}
                      height={46}
                      priority
                      className="h-10 sm:h-11 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(104,211,70,0.35)]" 
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-[#68D346] tracking-[0.2em] block uppercase">SIGER MASTER</span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono font-bold">
                        v2.11 • INDUSTRIAL DEFENSE
                      </span>
                    </div>
                    <span className="text-xs font-black text-white tracking-wider leading-none mt-1 font-['Hanken_Grotesk'] block">
                      COMANDO DE MISSÃO CRÍTICA
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed max-w-lg">
                  Plataforma integrada de inteligência e prontidão para Gestão de Emergências, Frotas Táticas, Central de Despacho (CAD/CECOM) e Atendimento Pré-Hospitalar (APH).
                </p>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[10px] text-zinc-400">
                  <span className="text-[#68D346] font-bold">Referências:</span>
                  <span>ABNT NBR 12962 • NBR 14276 • CONTRAN 558/80 • Resgate Internacional</span>
                </div>
              </div>

              {/* Coluna 3: SEGURANÇA & GOVERNANÇA */}
              <div className="lg:col-span-2 space-y-3 text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#B7F365] block">
                  SEGURANÇA & GOVERNANÇA
                </span>
                <ul className="space-y-2 text-xs font-sans">
                  <li>
                    <Link href="/login" className="text-zinc-400 hover:text-[#68D346] transition-colors flex items-center gap-1.5">
                      <span>Cockpit Administrativo Web</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/consulta" className="text-zinc-400 hover:text-[#68D346] transition-colors flex items-center gap-1.5">
                      <span>Auditoria & Rastreabilidade QR</span>
                    </Link>
                  </li>
                  <li>
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <span>Prontuário APH Vivo (ePCR)</span>
                    </span>
                  </li>
                  <li>
                    <Link href="/acesso-expirado" className="text-zinc-400 hover:text-[#68D346] transition-colors">
                      Políticas de Acesso & RLS
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Coluna 4: MÓDULOS INTEGRADOS */}
              <div className="lg:col-span-3 space-y-3 text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#B7F365] block">
                  MÓDULOS INTEGRADOS
                </span>
                <ul className="space-y-2 text-xs font-sans">
                  <li>
                    <Link href="/dashboard" className="text-zinc-400 hover:text-[#68D346] transition-colors flex items-center gap-1.5">
                      <span>• Engenharia de Ativos & SPCI</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/viaturas" className="text-zinc-400 hover:text-[#68D346] transition-colors flex items-center gap-1.5">
                      <span>• Gestão de Viaturas & TWI Frota</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/mapa" className="text-zinc-400 hover:text-[#68D346] transition-colors flex items-center gap-1.5">
                      <span>• Central de Despacho CECOM / CAD</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/public/ativos" className="text-zinc-400 hover:text-[#68D346] transition-colors flex items-center gap-1.5">
                      <span>• Catálogo Metrológico Oficial</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Coluna 5: ACESSO RÁPIDO & LEGAL */}
              <div className="lg:col-span-2 space-y-3 text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#B7F365] block">
                  ACESSO RÁPIDO
                </span>
                <ul className="space-y-2 text-xs font-sans">
                  <li>
                    <button
                      type="button"
                      onClick={() => setModalPolicy('privacy')}
                      className="text-zinc-400 hover:text-[#68D346] transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center gap-1.5 text-xs text-left"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#68D346]" />
                      <span>Privacidade & LGPD</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setModalPolicy('terms')}
                      className="text-zinc-400 hover:text-[#68D346] transition-colors cursor-pointer bg-transparent border-none p-0 flex items-center gap-1.5 text-xs text-left"
                    >
                      <span>Termos de Uso Operacional</span>
                    </button>
                  </li>
                  <li>
                    <Link 
                      href="/ronda"
                      className="text-zinc-400 hover:text-[#68D346] transition-colors flex items-center gap-1.5 text-xs"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-[#68D346]" />
                      <span>Terminal Mobile PWA</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/login?switch=true"
                      className="text-zinc-400 hover:text-[#68D346] transition-colors text-xs"
                    >
                      Trocar de Conta
                    </Link>
                  </li>
                </ul>
              </div>

            </div>

            {/* Bottom Bar: Copyright Oficial */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
              <p className="text-center sm:text-left">
                © {COPYRIGHT_YEAR} <span className="font-bold text-zinc-300">SIGER MASTER</span>. Desenvolvido e operado por{' '}
                <span className="text-[#68D346] font-bold">{COMPANY_NAME}</span>. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-[#68D346] animate-pulse" />
                <span>STATUS: OPERACIONAL (99.98% SLA)</span>
              </div>
            </div>

          </div>
        ) : (
          /* Versão Compacta (Para Dashboards e Telas Internas) */
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <p className="text-center sm:text-left">
              © {COPYRIGHT_YEAR} - <span className="font-bold text-zinc-300">SIGER MASTER</span> <span className="text-[#68D346]">|</span> {COMPANY_NAME}
            </p>
            <div className="flex items-center gap-4 text-[10.5px]">
              <button
                type="button"
                onClick={() => setModalPolicy('privacy')}
                className="text-zinc-400 hover:text-[#68D346] transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                Privacidade
              </button>
              <span className="text-zinc-700">•</span>
              <button
                type="button"
                onClick={() => setModalPolicy('terms')}
                className="text-zinc-400 hover:text-[#68D346] transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                Termos
              </button>
              <span className="text-zinc-700 hidden sm:inline">•</span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline">
                {SYSTEM_VERSION}
              </span>
            </div>
          </div>
        )}
      </footer>

      {/* Modal Desacoplado via React Portal (Eliminação Total de Estouro) */}
      <LegalPolicyModal
        isOpen={!!modalPolicy}
        type={modalPolicy}
        onClose={() => setModalPolicy(null)}
      />
    </>
  );
}
