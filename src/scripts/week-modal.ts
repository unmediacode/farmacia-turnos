import {
  MAX_APPOINTMENTS_PER_DAY,
  buildMonthGrid,
  dayjs,
  formatHuman,
  isWeekday,
  toDateKey
} from '@/lib/utils/date';

type AppointmentPayload = {
  date: string;
  name: string;
  phone?: string;
  notes?: string;
};

type HttpError = {
  error?: string;
};

const modal = document.getElementById('appointment-modal');
const form = document.getElementById('appointment-form') as HTMLFormElement | null;

if (!modal || !form) {
  console.warn('Modal de citas no encontrado en el DOM.');
} else {
  const nameInput = form.querySelector<HTMLInputElement>('input[name="name"]');
  const phoneInput = form.querySelector<HTMLInputElement>('input[name="phone"]');
  const notesInput = form.querySelector<HTMLTextAreaElement>('textarea[name="notes"]');
  const submitBtn = form.querySelector<HTMLButtonElement>('[data-submit]');
  const calendarGrid = form.querySelector<HTMLDivElement>('[data-calendar-grid]');
  const calendarTitle = form.querySelector<HTMLDivElement>('[data-cal-title]');
  const selectedInfo = form.querySelector<HTMLDivElement>('[data-selected-info]');
  const errorMessage = form.querySelector<HTMLParagraphElement>('[data-form-error]');

  if (
    !nameInput ||
    !submitBtn ||
    !calendarGrid ||
    !calendarTitle ||
    !selectedInfo ||
    !errorMessage
  ) {
    throw new Error('Configuración incompleta del formulario de citas.');
  }

  const cancelButtons = Array.from(form.querySelectorAll<HTMLButtonElement>('[data-cancel]'));
  const prevBtn = form.querySelector<HTMLButtonElement>('[data-cal-prev]');
  const nextBtn = form.querySelector<HTMLButtonElement>('[data-cal-next]');

  let currentMonth = dayjs();
  const selectedDates = new Set<string>();
  let lastFocusedElement: Element | null = null;

  const formatter = new Intl.DateTimeFormat('es-ES', { dateStyle: 'full' });

  const setModalVisibility = (show: boolean): void => {
    if (show) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.classList.add('overflow-hidden');
      modal.dispatchEvent(new CustomEvent('modal:open'));
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.classList.remove('overflow-hidden');
      modal.dispatchEvent(new CustomEvent('modal:close'));
    }
  };

  const showError = (message: string): void => {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
  };

  const clearError = (): void => {
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
  };

  const updateSelectedInfo = (): void => {
    if (selectedDates.size === 0) {
      selectedInfo.textContent = `Selecciona hasta ${MAX_APPOINTMENTS_PER_DAY} turnos por día laborable.`;
      return;
    }

    const sorted = Array.from(selectedDates).sort();
    const summary = sorted
      .map((date) => formatter.format(new Date(date)))
      .join(', ');
    selectedInfo.textContent = `${sorted.length} día(s) seleccionados: ${summary}`;
  };

  const resetForm = (): void => {
    form.reset();
    selectedDates.clear();
    clearError();
    updateSelectedInfo();
  };

  const renderCalendar = (): void => {
    calendarGrid.innerHTML = '';
    calendarTitle.textContent = currentMonth.format('MMMM YYYY');
    const monthDays = buildMonthGrid(currentMonth.year(), currentMonth.month());

    for (const dateKey of monthDays) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset['day'] = dateKey;
      button.className = 'rounded-md border px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-40';
      button.textContent = dayjs(dateKey).date().toString();

      if (!isWeekday(dateKey)) {
        button.disabled = true;
        button.classList.add('opacity-50');
        button.setAttribute('aria-hidden', 'true');
      }

      if (selectedDates.has(dateKey)) {
        button.classList.add('bg-brand-600', 'text-white');
        button.setAttribute('aria-pressed', 'true');
      } else {
        button.setAttribute('aria-pressed', 'false');
      }

      calendarGrid.append(button);
    }
  };

  const openModal = (defaultDate?: string | null): void => {
    lastFocusedElement = document.activeElement;
    resetForm();
    if (defaultDate) {
      const normalized = toDateKey(defaultDate);
      currentMonth = dayjs(normalized);
      selectedDates.add(normalized);
    } else {
      currentMonth = dayjs();
    }
    renderCalendar();
    updateSelectedInfo();
    setModalVisibility(true);
    nameInput.focus();
  };

  const closeModal = (): void => {
    setModalVisibility(false);
    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  };

  const createAppointment = (payload: AppointmentPayload): Promise<Response> =>
    fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });

  const updateAppointment = (id: string, body: Partial<AppointmentPayload>): Promise<Response> =>
    fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    });

  const deleteAppointment = (id: string): Promise<Response> =>
    fetch(`/api/appointments/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' }
    });

  calendarGrid.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const dayButton = target?.closest<HTMLButtonElement>('button[data-day]');
    if (!dayButton || dayButton.disabled) return;

    const date = dayButton.dataset['day'];
    if (!date) return;

    if (selectedDates.has(date)) {
      selectedDates.delete(date);
    } else {
      selectedDates.add(date);
    }

    renderCalendar();
    updateSelectedInfo();
  });

  prevBtn?.addEventListener('click', () => {
    currentMonth = currentMonth.subtract(1, 'month');
    renderCalendar();
  });

  nextBtn?.addEventListener('click', () => {
    currentMonth = currentMonth.add(1, 'month');
    renderCalendar();
  });

  cancelButtons.forEach((btn) => btn.addEventListener('click', () => closeModal()));

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  const handleCreate = (trigger: Element): void => {
    const date = trigger.getAttribute('data-add');
    if (!date) return;
    openModal(date);
  };

  const handleUpdate = async (trigger: Element): Promise<void> => {
    const id = trigger.getAttribute('data-edit');
    if (!id) return;
    const name = window.prompt('Nuevo nombre (dejar vacío para no cambiar):') ?? undefined;
    const phone = window.prompt('Nuevo teléfono (opcional):') ?? undefined;
    const notes = window.prompt('Nuevas notas (opcional):') ?? undefined;

    const trimmedName = name?.trim();
    const trimmedPhone = phone?.trim();
    const trimmedNotes = notes?.trim();

    const updatePayload: Partial<AppointmentPayload> = {};
    if (trimmedName && trimmedName !== '') {
      updatePayload.name = trimmedName;
    }
    if (trimmedPhone && trimmedPhone !== '') {
      updatePayload.phone = trimmedPhone;
    }
    if (trimmedNotes && trimmedNotes !== '') {
      updatePayload.notes = trimmedNotes;
    }

    if (Object.keys(updatePayload).length === 0) {
      return;
    }

    const response = await updateAppointment(id, updatePayload);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as HttpError;
      window.alert(data.error ?? 'No se pudo actualizar la cita.');
      return;
    }

    window.location.reload();
  };

  const handleDelete = async (trigger: Element): Promise<void> => {
    const id = trigger.getAttribute('data-delete');
    if (!id) return;
    if (!window.confirm('¿Borrar este cliente?')) return;

    const response = await deleteAppointment(id);
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as HttpError;
      window.alert(data.error ?? 'No se pudo borrar la cita.');
      return;
    }

    window.location.reload();
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError();

    const name = nameInput.value.trim();
    const phone = phoneInput?.value.trim();
    const notes = notesInput?.value.trim();

    if (!name) {
      showError('El nombre es obligatorio.');
      nameInput.focus();
      return;
    }

    if (selectedDates.size === 0) {
      showError('Selecciona al menos un día laborable.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');

    try {
      const dates = Array.from(selectedDates).sort();
      const normalizedPhone = phone && phone !== '' ? phone : null;
      const normalizedNotes = notes && notes !== '' ? notes : null;
      for (const date of dates) {
        const payload: AppointmentPayload = { date, name };
        if (normalizedPhone) {
          payload.phone = normalizedPhone;
        }
        if (normalizedNotes) {
          payload.notes = normalizedNotes;
        }

        const response = await createAppointment(payload);
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as HttpError;
          showError(
            `Error en ${formatHuman(date)}: ${
              data.error ?? response.statusText ?? 'No se pudo registrar la cita.'
            }`
          );
          return;
        }
      }

      closeModal();
      window.location.reload();
    } finally {
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
    }
  });

  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    if (!target) return;
    const trigger = target.closest('[data-add], [data-edit], [data-delete], [data-print]');
    if (!trigger) return;

    if (trigger.hasAttribute('data-add')) {
      handleCreate(trigger);
    } else if (trigger.hasAttribute('data-edit')) {
      void handleUpdate(trigger);
    } else if (trigger.hasAttribute('data-delete')) {
      void handleDelete(trigger);
    } else if (trigger.hasAttribute('data-print')) {
      window.print();
    }
  });
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
