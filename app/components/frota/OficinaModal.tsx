'use client';

import React, { useState, useEffect } from 'react';
import { OficinaPrestador } from '@/lib/types/frota';
import { saveOficinaAction } from '@/app/actions/frotaActions';
import { soundNotificationService } from '@/lib/soundNotificationService';
import ModalBaseCorporativo from '@/app/components/ui/ModalBaseCorporativo';
import { 
  Wrench, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface OficinaModalProps {
  isOpen: boolean;
  oficinaToEdit?: OficinaPrestador | null;
  contratoId: string;
  onClose: () => void;
  onSuccess: (saved: OficinaPrestador) => void;
}

const ESPECIALIDADES_DISPONIVEIS = [
  'MECÂNICA PESADA & DIESEL',
  'SISTEMA DE FREIOS & SUSPENSÃO',
  'AUTOELÉTRICA & BATERIAS',
  'INJEÇÃO ELETRÔNICA & DIAGNÓSTICO',
  'GEOMETRIA, BALANCEAMENTO & PNEUS',
  'BOMBAS DE INCÊNDIO & HIDRÁULICA',
  'LANTERNAGEM & PINTURA',
  'GUINCHO & SOCORRO 24H'
];

export const OficinaModal: React.FC<OficinaModalProps> = ({
  isOpen,
  oficinaToEdit,
  contratoId,
  onClose,
  onSuccess
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [telefone, setTelefone] = useState('');
  const [telefonePlantao, setTelefonePlantao] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [especialidades, setEspecialidades] = useState<string[]>(['MECÂNICA PESADA & DIESEL']);
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (oficinaToEdit) {
      setRazaoSocial(oficinaToEdit.razao_social || '');
      setNomeFantasia(oficinaToEdit.nome_fantasia || '');
      setCnpj(oficinaToEdit.cnpj || '');
      setResponsavel(oficinaToEdit.responsavel || '');
      setTelefone(oficinaToEdit.telefone || '');
      setTelefonePlantao(oficinaToEdit.telefone_plantao || oficinaToEdit.contato_emergencia || '');
      setEmail(oficinaToEdit.email || '');
      setEndereco(oficinaToEdit.endereco || '');
      setEspecialidades(oficinaToEdit.especialidades || ['MECÂNICA PESADA & DIESEL']);
      setAtivo(oficinaToEdit.ativo !== undefined ? oficinaToEdit.ativo : true);
    } else {
      setRazaoSocial('');
      setNomeFantasia('');
      setCnpj('');
      setResponsavel('');
      setTelefone('');
      setTelefonePlantao('');
      setEmail('');
      setEndereco('');
      setEspecialidades(['MECÂNICA PESADA & DIESEL']);
      setAtivo(true);
    }
    setErrorMsg(null);
  }, [oficinaToEdit, isOpen]);

  const toggleEspecialidade = (esp: string) => {
    if (especialidades.includes(esp)) {
      setEspecialidades(especialidades.filter((e) => e !== esp));
    } else {
      setEspecialidades([...especialidades, esp]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!razaoSocial.trim()) {
      setErrorMsg('A Razão Social da oficina é obrigatória.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveOficinaAction({
        id: oficinaToEdit?.id,
        contrato_id: contratoId || 'ONÇA PUMA',
        razao_social: razaoSocial,
        nome_fantasia: nomeFantasia || razaoSocial,
        cnpj: cnpj || null,
        responsavel: responsavel || null,
        telefone: telefone || null,
        telefone_plantao: telefonePlantao || null,
        contato_emergencia: telefonePlantao || null,
        email: email || null,
        endereco: endereco || null,
        especialidades: especialidades,
        ativo: ativo
      });

      if (res.success && res.data) {
        soundNotificationService.playSuccessSound();
        onSuccess(res.data);
        onClose();
      } else {
        setErrorMsg(res.error || 'Falha ao gravar prestador.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro inesperado.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalBaseCorporativo
      isOpen={isOpen}
      onClose={onClose}
      modalId="modal-frota-oficina"
      badgeSistema="SIGER HOMOLOGAÇÃO & OS EXTERNA"
      badgeContrato={contratoId || 'ONÇA PUMA'}
      titulo={oficinaToEdit ? `EDITAR OFICINA • ${oficinaToEdit.razao_social}` : 'CREDENCIAR NOVA OFICINA / PRESTADOR'}
      subtitulo="Homologação técnica de prestadores credenciados para manutenção preventiva e corretiva externa"
      icon={Wrench}
      maxWidthClass="max-w-3xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-xs text-slate-500 font-sans">
            Status: <strong className={ativo ? 'text-emerald-600' : 'text-slate-400'}>{ativo ? 'Credenciada Ativa' : 'Inativa'}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
            >
              {isSaving ? 'Gravando...' : 'Salvar Oficina'}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 font-sans">
        {errorMsg && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-xs text-red-800 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SEÇÃO 1: DADOS CADASTRAIS */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              1. Identificação Jurídica da Oficina
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Razão Social *
              </label>
              <input
                type="text"
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value.toUpperCase())}
                placeholder="Ex: AUTO MECÂNICA DIESEL BRASIL LTDA"
                className="w-full text-xs font-semibold uppercase px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nome Fantasia
              </label>
              <input
                type="text"
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value.toUpperCase())}
                placeholder="Ex: OFICINA DIESEL CARAJÁS"
                className="w-full text-xs font-semibold uppercase px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                CNPJ
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status de Credenciamento
              </label>
              <select
                value={ativo ? 'true' : 'false'}
                onChange={(e) => setAtivo(e.target.value === 'true')}
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                <option value="true">ATIVA / HOMOLOGADA</option>
                <option value="false">INATIVA / SUSPENSA</option>
              </select>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: CONTATO & LOCALIZAÇÃO */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              2. Contato & Plantão de Atendimento
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Gerente / Técnico Responsável
              </label>
              <input
                type="text"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                placeholder="Ex: Carlos Mecânico Chefe"
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Telefone Comercial
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(94) 3356-0000"
                className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Plantão 24h / Emergência
              </label>
              <input
                type="text"
                value={telefonePlantao}
                onChange={(e) => setTelefonePlantao(e.target.value)}
                placeholder="(94) 99100-0000"
                className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Endereço Operacional Completo
              </label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Ex: Av. Faruk Salmen, 850 - Polo Moveleiro, Parauapebas - PA"
                className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: ESPECIALIDADES HOMOLOGADAS */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              3. Especialidades Homologadas
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ESPECIALIDADES_DISPONIVEIS.map((esp) => {
              const selecionada = especialidades.includes(esp);
              return (
                <label
                  key={esp}
                  onClick={() => toggleEspecialidade(esp)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    selecionada
                      ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-2xs'
                      : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selecionada}
                    onChange={() => {}}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{esp}</span>
                </label>
              );
            })}
          </div>
        </div>

      </form>
    </ModalBaseCorporativo>
  );
};
