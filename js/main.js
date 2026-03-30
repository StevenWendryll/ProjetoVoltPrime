function animateCount(el, target, suffix, ms) {
    let t0 = null;
    function step(ts) {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / ms, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function releaseFocus(el) {
    if (el._trap) { el.removeEventListener('keydown', el._trap); delete el._trap; }
}

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    /* ══ FUNÇÕES UTILITÁRIAS ══════════════════════════════════════════ */
    function safeOpen(url) {
        try {
            const u = new URL(url);
            if (!['https:', 'http:', 'tel:', 'mailto:'].includes(u.protocol)) return;
            window.open(u.href, '_blank', 'noopener,noreferrer');
        } catch { /* URL inválida */ }
    }

    function scrollToTarget(id) {
        if (id === 'top') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /* ══ GESTÃO DO MODAL E FOCO ═══════════════════════════════════════ */
    const modalOverlay = document.getElementById('modalOverlay');
    let prevFocus = null;

    function trapFocus(el) {
        const sel = 'button:not([disabled]),input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])';
        const nodes = [...el.querySelectorAll(sel)];
        const first = nodes[0], last = nodes.at(-1);
        el._trap = e => {
            if (e.key !== 'Tab') return;
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };
        el.addEventListener('keydown', el._trap);
    }

    function openModal() {
        prevFocus = document.activeElement;
        modalOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            const f = modalOverlay.querySelector('input,select,button:not(.modal-close)');
            if (f) f.focus();
            trapFocus(modalOverlay);
        }, 120);
    }

    function closeModal() {
        modalOverlay.classList.remove('open');
        document.body.style.overflow = '';
        releaseFocus(modalOverlay);
        if (prevFocus) prevFocus.focus();
    }

    function openServiceModal(title, desc, icon, svcValue) {
        document.getElementById('modalTitle').textContent = icon + ' ' + title;
        document.getElementById('modalSub').textContent = desc;
        const sel = document.getElementById('f-svc');
        for (const opt of sel.options) { if (opt.value === svcValue) { sel.value = svcValue; break; } }
        openModal();
    }

    /* ══ EVENT LISTENERS GLOBAIS ══════════════════════════════════════ */

    // Abrir Modal
    document.querySelectorAll('.js-open-modal').forEach(btn => {
        btn.addEventListener('click', openModal);
    });

    // Fechar Modal
    document.querySelectorAll('.js-close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    modalOverlay.addEventListener('click', e => {
        if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal();
    });

    // Scroll Suave
    document.querySelectorAll('.js-scroll-to').forEach(btn => {
        btn.addEventListener('click', (e) => {
            scrollToTarget(e.currentTarget.dataset.target);
        });
    });

    // Abrir URL Segura (WhatsApp)
    document.querySelectorAll('.js-safe-open').forEach(btn => {
        btn.addEventListener('click', (e) => {
            safeOpen(e.currentTarget.dataset.url);
        });
    });

    // Cards de Serviço
    document.querySelectorAll('.js-service-card').forEach(card => {
        const triggerModal = () => {
            openServiceModal(
                card.dataset.title,
                card.dataset.desc,
                card.dataset.icon,
                card.dataset.svc
            );
        };
        card.addEventListener('click', triggerModal);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerModal(); }
        });
    });

    // Navegação Inferior
    const navBtns = document.querySelectorAll('.js-nav-btn');
    navBtns.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget.dataset.target;

            navBtns.forEach((b, i) => {
                b.classList.toggle('active', i === index);
                b.setAttribute('aria-current', i === index ? 'page' : 'false');
            });
            scrollToTarget(target);
        });
    });

    /* ══ PROGRESSO DE SCROLL & HIGHLIGHT DE NAV ═══════════════════════ */
    let scrollRaf = null;
    window.addEventListener('scroll', () => {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(() => {
            const y = window.scrollY;
            const max = document.body.scrollHeight - window.innerHeight;

            // Barra de Progresso e Header
            document.getElementById('scrollBar').style.width = (max > 0 ? (y / max) * 100 : 0).toFixed(1) + '%';
            document.getElementById('siteHdr').classList.toggle('scrolled', y > 6);

            // Auto-highlight da navegação
            const offset = y + 130;
            const svc = document.getElementById('servicos');
            const area = document.getElementById('area');
            let active = 0;
            if (area && offset >= area.offsetTop) active = 2;
            else if (svc && offset >= svc.offsetTop) active = 1;

            navBtns.forEach((b, i) => b.classList.toggle('active', i === active));

            scrollRaf = null;
        });
    }, { passive: true });

    /* ══ EFEITO GLARE (POINTER NO DESKTOP) ════════════════════════════ */
    if (globalThis.matchMedia('(hover: hover)').matches) {
        document.querySelectorAll('[data-glare]').forEach(card => {
            card.addEventListener('pointermove', e => {
                const r = card.getBoundingClientRect();
                card.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
                card.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
            }, { passive: true });
            card.addEventListener('pointerleave', () => {
                card.style.setProperty('--mx', '50%'); card.style.setProperty('--my', '50%');
            });
        });
    }

    /* ══ INTERSECTION OBSERVERS (REVEAL & CONTADOR) ═══════════════════ */
    const revealObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    const statsStrip = document.querySelector('.stats-strip');
    if (statsStrip) {
        const countObs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    animateCount(document.getElementById('cnt-cli'), 1240, '+', 1800);
                    countObs.disconnect();
                }
            });
        }, { threshold: 0.4 });
        countObs.observe(statsStrip);
    }

    /* ══ DEPOIMENTOS (MARQUEE) ════════════════════════════════════════ */
    const TESTI = [
        { name: 'Carlos M.', loc: 'Angra dos Reis', color: '#f5c842', text: 'Atendimento rápido e eficiente! O eletricista chegou em menos de 2h e resolveu o curto sem deixar bagunça.' },
        { name: 'Ana P.', loc: 'Paraty', color: '#3b82f6', text: 'Fizeram a instalação elétrica do meu apartamento completo. Trabalho impecável, preço justo e muita educação.' },
        { name: 'Roberto L.', loc: 'Angra dos Reis', color: '#ff6b35', text: 'Instalaram câmeras e ar-condicionado. Equipe super competente, recomendo demais!' },
        { name: 'Fernanda S.', loc: 'Mangaratiba', color: '#22c55e', text: 'Trocaram meu quadro de luz e modernizaram com DR. Serviço garantido e muito profissional.' },
        { name: 'Marcos T.', loc: 'Angra dos Reis', color: '#a78bfa', text: 'Iluminação LED no escritório todo. Economia na conta de energia visível já no primeiro mês.' },
        { name: 'Juliana R.', loc: 'Ilha Grande', color: '#f472b6', text: 'Resolveram um problema elétrico complicado que outro eletricista não conseguiu. Super recomendo!' },
    ];
    const track = document.getElementById('marqueeTrack');
    if (track) {
        [...TESTI, ...TESTI].forEach(t => {
            const card = document.createElement('article'); card.className = 't-card'; card.setAttribute('aria-label', 'Depoimento de ' + t.name);
            const stars = document.createElement('div'); stars.className = 't-stars'; stars.setAttribute('aria-label', 'Avaliação 5 de 5 estrelas'); stars.textContent = '★★★★★';
            const text = document.createElement('p'); text.className = 't-text'; text.textContent = '\u201C' + t.text + '\u201D';
            const author = document.createElement('div'); author.className = 't-author';
            const initials = t.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const avatar = document.createElement('div'); avatar.className = 't-avatar'; avatar.setAttribute('aria-hidden', 'true'); avatar.style.cssText = 'background:' + t.color + '22;color:' + t.color; avatar.textContent = initials;
            const info = document.createElement('div');
            const nm = document.createElement('div'); nm.className = 't-name'; nm.textContent = t.name;
            const lc = document.createElement('div'); lc.className = 't-loc'; lc.textContent = t.loc;
            info.append(nm, lc); author.append(avatar, info); card.append(stars, text, author);
            track.appendChild(card);
        });
    }

    /* ══ FORMULÁRIO ═══════════════════════════════════════════════════ */

    // 1. Máscara do Telefone (Formata enquanto o usuário digita)
    const phoneInput = document.getElementById('f-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function () {
            let v = this.value.replaceAll(/\D/g, '').slice(0, 11);
            if (v.length > 2) v = '(' + v.slice(0, 2) + ') ' + v.slice(2);
            if (v.length > 10) v = v.slice(0, 10) + '-' + v.slice(10);
            this.value = v;
        });
    }

    // 2. Contador de caracteres da mensagem
    const msgEl = document.getElementById('f-msg');
    const ccEl = document.getElementById('char-msg');
    if (msgEl && ccEl) {
        msgEl.addEventListener('input', () => {
            const n = msgEl.value.length;
            ccEl.textContent = n + ' / 500';
            ccEl.style.color = n > 450 ? '#f87171' : '';
        });
    }

    // 3. REGRAS DE VALIDAÇÃO (Obrigatório para o envio funcionar)
    const FIELDS = {
        'f-name': { group: 'fg-name', test: v => v.length >= 2 && v.length <= 80 && /^[A-Za-zÀ-ÿ\s'-]+$/.test(v) },
        'f-phone': { group: 'fg-phone', test: v => v.replaceAll(/\D/g, '').length >= 10 },
        'f-svc': { group: 'fg-svc', test: v => v !== '' },
    };

    // 4. Função que verifica se os campos estão corretos
    function validateField(id) {
        const { group, test } = FIELDS[id];
        const f = document.getElementById(id);
        const ok = test(f.value.trim());
        document.getElementById(group).classList.toggle('has-error', !ok);
        f.setAttribute('aria-invalid', ok ? 'false' : 'true');
        return ok;
    }

    // Verifica os erros quando o usuário tira o foco (clica fora) do campo
    Object.keys(FIELDS).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('blur', () => validateField(id));
    });

    // 5. ENVIO DO FORMULÁRIO (WHATSAPP)
    const svcForm = document.getElementById('svcForm');
    if (svcForm) {
        svcForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Tenta validar todos os campos listados acima
            const allValid = Object.keys(FIELDS).map(validateField).every(Boolean);
            if (!allValid) {
                const first = document.querySelector('.has-error input,.has-error select');
                if (first) first.focus(); // Joga o cursor no campo com erro
                return; // Para o envio se tiver erro
            }

            // Muda o estado do botão
            const btn = document.getElementById('submitBtn');
            btn.disabled = true;
            btn.textContent = 'Redirecionando...';

            // Captura os dados digitados
            const nome = document.getElementById('f-name').value.trim();
            const telefone = document.getElementById('f-phone').value.trim();
            const servico = document.getElementById('f-svc').value;
            const mensagem = document.getElementById('f-msg').value.trim() || 'Sem detalhes adicionais.';

            // Monta a mensagem para o WhatsApp
            const textoWhatsApp = `*Nova Solicitação de Serviço*\n\n*Nome:* ${nome}\n*Contato:* ${telefone}\n*Serviço desejado:* ${servico}\n*Descrição:* ${mensagem}`;

            // Número de destino
            const numeroDestino = '5528992227076';

            // Abre a janela do WhatsApp com a mensagem
            const urlBase = `https://wa.me/${numeroDestino}?text=${encodeURIComponent(textoWhatsApp)}`;
            window.open(urlBase, '_blank');

            // Atualiza o visual do botão
            btn.textContent = '✅ Enviado!';
            btn.style.background = '#22c55e';

            // Fecha o modal e limpa tudo após 1.5 segundos
            setTimeout(() => {
                closeModal();
                svcForm.reset();
                if (ccEl) ccEl.textContent = '0 / 500';

                btn.disabled = false;
                btn.style.background = '';
                btn.textContent = 'Enviar solicitação ⚡';
            }, 1500);

        });
    }
});