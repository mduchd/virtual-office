import { generateQrSvg } from '../../../shared/qrcode';
import type { UiContext } from './context';
import { h, iconButton, setHidden, setText } from './dom';
import { ICONS } from './icons';
import { tr } from '../../../shared/i18n';

interface TunnelStatus {
  active: boolean;
  starting: boolean;
  url: string | null;
  user: string;
  pass: string;
  error: string | null;
}

export class RemotePanel {
  readonly el: HTMLElement;
  private anchor?: HTMLElement;
  private statusState: TunnelStatus = {
    active: false,
    starting: false,
    url: null,
    user: 'admin',
    pass: 'habblaud12345',
    error: null,
  };

  private isEditingCreds = false;
  private savingCreds = false;
  private credsError: string | null = null;
  private credsSuccess = false;

  private readonly statusPill: HTMLElement;
  private readonly bodyContent: HTMLElement;
  private pollInterval?: number;

  constructor(private readonly ctx: UiContext) {
    this.statusPill = h('span', { class: 'ui-pill', text: tr('Desligado') });

    const closeBtn = iconButton(ICONS.close, tr('Fechar'), () => this.hide(), 'ui-icon-btn--sm');

    this.bodyContent = h('div', { class: 'ui-remote-panel__body' });

    this.el = h(
      'div',
      {
        class: 'ui-popover ui-remote-panel',
        role: 'dialog',
        tabIndex: -1,
        attrs: { 'aria-label': tr('Acesso pelo celular'), id: 'ui-remote-panel', popover: 'auto' },
      },
      h(
        'div',
        { class: 'ui-popover__head' },
        h('div', { class: 'ui-remote-panel__title-wrap' }, h('h2', { text: tr('Acesso pelo celular') }), this.statusPill),
        closeBtn,
      ),
      this.bodyContent,
    );

    this.render();

    this.el.addEventListener('toggle', () => {
      this.anchor?.setAttribute('aria-expanded', String(this.isOpen));
      if (this.isOpen) {
        this.fetchStatus();
      } else {
        if (this.pollInterval) clearInterval(this.pollInterval);
      }
    });
  }

  get isOpen(): boolean {
    try {
      return this.el.matches(':popover-open');
    } catch {
      return this.el.classList.contains('is-open');
    }
  }

  toggle(anchor: HTMLElement): void {
    this.anchor = anchor;
    if (this.isOpen) return this.hide();
    const r = anchor.getBoundingClientRect();
    this.el.style.top = `${Math.round(r.bottom + 8)}px`;
    this.el.style.right = `${Math.max(8, Math.round(innerWidth - r.right - 4))}px`;
    if (typeof this.el.showPopover === 'function') this.el.showPopover();
    else this.el.classList.add('is-open');
    anchor.setAttribute('aria-expanded', 'true');
    this.el.focus();
    this.render();
    this.fetchStatus();
  }

  hide(): void {
    if (!this.isOpen) return;
    if (typeof this.el.hidePopover === 'function') this.el.hidePopover();
    else this.el.classList.remove('is-open');
    this.anchor?.setAttribute('aria-expanded', 'false');
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  private async fetchStatus(): Promise<void> {
    try {
      const res = await fetch('/api/tunnel', { cache: 'no-store' });
      if (res.ok) {
        this.statusState = (await res.json()) as TunnelStatus;
        this.render();
      } else if (res.status === 404) {
        this.statusState.error = tr('Vui lòng khởi động lại server để áp dụng tính năng mới.');
        this.render();
      }
    } catch (err: any) {
      this.statusState.error = err.message || String(err);
      this.render();
    }
  }

  private async startTunnel(): Promise<void> {
    this.statusState.starting = true;
    this.statusState.error = null;
    this.render();

    try {
      const res = await fetch('/api/tunnel/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khởi động');
      this.statusState = data;
    } catch (err: any) {
      this.statusState.starting = false;
      this.statusState.active = false;
      this.statusState.error = err.message || String(err);
    }
    this.render();
  }

  private async stopTunnel(): Promise<void> {
    this.statusState.starting = true;
    this.render();

    try {
      const res = await fetch('/api/tunnel/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      this.statusState = data;
    } catch (err: any) {
      this.statusState.error = err.message || String(err);
    } finally {
      this.statusState.starting = false;
    }
    this.render();
  }

  private render(): void {
    this.bodyContent.innerHTML = '';

    if (this.statusState.starting) {
      setText(this.statusPill, tr('Conectando…'));
      this.statusPill.className = 'ui-pill ui-pill--starting';

      this.bodyContent.append(
        h(
          'div',
          { class: 'ui-remote-panel__loading' },
          h('div', { class: 'ui-spinner' }),
          h('p', { text: tr('Criando túnel seguro da Cloudflare…') }),
          h('p', { class: 'ui-set__hint', text: tr('Leva de 3 a 5 segundos para gerar o endereço.') }),
        ),
      );
      return;
    }

    if (this.statusState.error) {
      this.bodyContent.append(
        h(
          'div',
          { class: 'ui-remote-panel__error' },
          h('p', { text: `⚠️ ${this.statusState.error}` }),
          h('button', {
            class: 'ui-btn ui-btn--sm',
            type: 'button',
            text: tr('Tentar de novo'),
            on: { click: () => this.startTunnel() },
          }),
        ),
      );
    }

    if (!this.statusState.active) {
      setText(this.statusPill, tr('Desligado'));
      this.statusPill.className = 'ui-pill ui-pill--off';

      this.bodyContent.append(
        h(
          'div',
          { class: 'ui-remote-panel__intro' },
          h('p', {
            text: tr(
              'Ligue o túnel para abrir o escritório e controlar os agentes no celular (4G, 5G ou Wi-Fi em qualquer lugar).',
            ),
          }),
          h(
            'ul',
            { class: 'ui-remote-panel__features' },
            h('li', { text: '✓ ' + tr('Sem necessidade de instalar certificado CA') }),
            h('li', { text: '✓ ' + tr('Aprovar ou recusar pedidos de permissão') }),
            h('li', { text: '✓ ' + tr('Enviar mensagens e instruções para os agentes') }),
            h('li', { text: '✓ ' + tr('Criar novos agentes remotamente') }),
          ),
          this.renderCredsBox(),
          h('button', {
            class: 'ui-btn ui-btn--primary ui-remote-panel__start-btn',
            type: 'button',
            text: '🚀 ' + tr('Ligar acesso remoto'),
            on: { click: () => this.startTunnel() },
          }),
        ),
      );
      return;
    }

    // Active State
    setText(this.statusPill, tr('Ativo'));
    this.statusPill.className = 'ui-pill ui-pill--active';

    const url = this.statusState.url || '';
    const qrContainer = h('div', { class: 'ui-remote-panel__qr' });
    qrContainer.innerHTML = generateQrSvg(url, 4, 2);

    const copyBtn = h('button', {
      class: 'ui-btn ui-btn--sm',
      type: 'button',
      text: tr('Copiar'),
      on: {
        click: () => {
          navigator.clipboard.writeText(url);
          setText(copyBtn, tr('Copiado!'));
          setTimeout(() => setText(copyBtn, tr('Copiar')), 2000);
        },
      },
    });

    const urlRow = h(
      'div',
      { class: 'ui-remote-panel__url-box' },
      h('input', {
        class: 'ui-rename__input',
        attrs: { type: 'text', readonly: 'readonly', value: url },
        on: { click: (e: any) => e.target?.select?.() },
      }),
      copyBtn,
    );

    const stopBtn = h('button', {
      class: 'ui-btn ui-btn--danger',
      type: 'button',
      text: '⏹ ' + tr('Desligar acesso remoto'),
      on: { click: () => this.stopTunnel() },
    });

    this.bodyContent.append(
      h(
        'div',
        { class: 'ui-remote-panel__active-wrap' },
        h('p', { class: 'ui-remote-panel__scan-tip', text: '📸 ' + tr('Escaneie o QR Code com a câmera do celular:') }),
        qrContainer,
        urlRow,
        this.renderCredsBox(),
        stopBtn,
      ),
    );
  }

  private renderCredsBox(): HTMLElement {
    const box = h('div', { class: 'ui-remote-panel__creds' });

    if (this.isEditingCreds) {
      const userInput = h('input', {
        class: 'ui-rename__input ui-remote-panel__cred-input',
        attrs: { type: 'text', value: this.statusState.user, placeholder: tr('Usuário') },
      }) as HTMLInputElement;

      const passInput = h('input', {
        class: 'ui-rename__input ui-remote-panel__cred-input',
        attrs: { type: 'text', value: this.statusState.pass, placeholder: tr('Senha') },
      }) as HTMLInputElement;

      const saveBtn = h('button', {
        class: 'ui-btn ui-btn--primary ui-btn--sm',
        type: 'button',
        text: this.savingCreds ? tr('Salvando…') : tr('Salvar'),
        attrs: this.savingCreds ? { disabled: 'disabled' } : {},
        on: {
          click: async () => {
            const user = userInput.value.trim();
            const pass = passInput.value.trim();
            if (!user) {
              this.credsError = tr('O nome de usuário não pode ficar vazio');
              this.render();
              return;
            }
            if (!pass || pass.length < 4) {
              this.credsError = tr('A senha deve ter pelo menos 4 caracteres');
              this.render();
              return;
            }
            this.savingCreds = true;
            this.credsError = null;
            this.render();
            try {
              const res = await fetch('/api/tunnel/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, pass }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || tr('Erro ao atualizar'));
              this.statusState = data;
              this.isEditingCreds = false;
              this.credsSuccess = true;
              setTimeout(() => {
                this.credsSuccess = false;
                this.render();
              }, 3000);
            } catch (err: any) {
              this.credsError = err.message || String(err);
            } finally {
              this.savingCreds = false;
              this.render();
            }
          },
        },
      });

      const cancelBtn = h('button', {
        class: 'ui-btn ui-btn--sm',
        type: 'button',
        text: tr('Cancelar'),
        attrs: this.savingCreds ? { disabled: 'disabled' } : {},
        on: {
          click: () => {
            this.isEditingCreds = false;
            this.credsError = null;
            this.render();
          },
        },
      });

      const errEl = this.credsError
        ? h('p', { class: 'ui-remote-panel__creds-err', text: `⚠️ ${this.credsError}` })
        : undefined;

      box.append(
        h(
          'div',
          { class: 'ui-remote-panel__edit-form' },
          h('div', { class: 'ui-remote-panel__edit-field' }, h('label', { text: tr('Usuário: ') }), userInput),
          h('div', { class: 'ui-remote-panel__edit-field' }, h('label', { text: tr('Senha: ') }), passInput),
          ...(errEl ? [errEl] : []),
          h('div', { class: 'ui-remote-panel__edit-actions' }, saveBtn, cancelBtn),
        ),
      );
      return box;
    }

    const editBtn = h('button', {
      class: 'ui-btn ui-btn--sm ui-remote-panel__edit-btn',
      type: 'button',
      text: '✏️ ' + tr('Alterar'),
      attrs: { title: tr('Alterar usuário e senha') },
      on: {
        click: () => {
          this.isEditingCreds = true;
          this.credsError = null;
          this.render();
        },
      },
    });

    const userRow = h(
      'div',
      { class: 'ui-remote-panel__cred-item' },
      h('span', { text: tr('Usuário: ') }),
      h('strong', { text: this.statusState.user }),
    );

    const passRow = h(
      'div',
      { class: 'ui-remote-panel__cred-item' },
      h('span', { text: tr('Senha: ') }),
      h('strong', { text: this.statusState.pass }),
    );

    const successEl = this.credsSuccess
      ? h('div', { class: 'ui-remote-panel__creds-ok', text: '✓ ' + tr('Credenciais atualizadas com sucesso!') })
      : undefined;

    box.append(
      userRow,
      passRow,
      ...(successEl ? [successEl] : []),
      h('div', { class: 'ui-remote-panel__cred-foot' }, editBtn),
    );
    return box;
  }
}
