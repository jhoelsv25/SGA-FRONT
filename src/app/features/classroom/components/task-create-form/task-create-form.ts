import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Z_MODAL_DATA, ZardDialogRef } from '@shared/components/dialog';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardCheckboxComponent } from '@/shared/components/checkbox';
import { ZardDatePickerComponent } from '@/shared/components/date-picker';
import { ZardInputDirective } from '@/shared/components/input';
import { SelectOptionComponent } from '@/shared/widgets/select-option/select-option';
import { ClassroomApi, ClassroomTaskEditorPayload } from '../../services/classroom-api';

type LocalSelectOption = { value: string | number | boolean; label: string };

type QuizQuestionDraft = {
  id: string;
  prompt: string;
  type: 'single_choice' | 'multiple_choice' | 'short_answer';
  points: number;
  required: boolean;
  options: Array<{ id: string; label: string; isCorrect: boolean }>;
};

@Component({
  selector: 'sga-task-create-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardCheckboxComponent,
    ZardDatePickerComponent,
    ZardInputDirective,
    SelectOptionComponent,
  ],
  templateUrl: './task-create-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCreateForm {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ClassroomApi);
  private readonly data = inject<{
    sectionCourseId: string;
    mode?: 'create' | 'edit';
    task?: ClassroomTaskEditorPayload | null;
  }>(Z_MODAL_DATA);
  private readonly ref = inject(ZardDialogRef);

  readonly uploading = signal(false);
  readonly resourceMode = signal<'none' | 'file' | 'url'>('none');
  readonly questions = signal<QuizQuestionDraft[]>([]);
  readonly currentStep = signal<1 | 2 | 3>(1);
  readonly isEditMode = computed(() => this.data.mode === 'edit');

  readonly typeOptions: LocalSelectOption[] = [
    { value: 'homework', label: 'Tarea' },
    { value: 'project', label: 'Proyecto' },
    { value: 'quiz', label: 'Quiz / formulario' },
    { value: 'exam', label: 'Examen' },
  ];

  readonly questionTypeOptions: LocalSelectOption[] = [
    { value: 'single_choice', label: 'Selección única' },
    { value: 'multiple_choice', label: 'Selección múltiple' },
    { value: 'short_answer', label: 'Respuesta corta' },
  ];

  readonly evaluationOptions: LocalSelectOption[] = [
    { value: 20, label: 'Escala sobre 20' },
    { value: 100, label: 'Escala sobre 100' },
    { value: 10, label: 'Escala sobre 10' },
  ];

  readonly attemptsOptions: LocalSelectOption[] = [
    { value: 1, label: '1 intento' },
    { value: 2, label: '2 intentos' },
    { value: 3, label: '3 intentos' },
  ];

  readonly form = this.fb.group({
    title: ['', [Validators.required]],
    type: ['homework', [Validators.required]],
    description: [''],
    dueDate: [null as Date | null, [Validators.required]],
    scheduleEnabled: [false, [Validators.required]],
    publishDate: [null as Date | null],
    publishTime: ['08:00'],
    maxScore: [20, [Validators.required]],
    maxAttempts: [1, [Validators.required]],
    lateSubmissionAllowed: [true, [Validators.required]],
    resourceUrl: [''],
  });

  readonly isQuiz = computed(() => this.form.controls.type.value === 'quiz');
  readonly stepTitle = computed(() => {
    if (this.currentStep() === 1) return 'Tipo de actividad';
    if (this.currentStep() === 2) return 'Configuración';
    return this.isQuiz() ? 'Constructor del quiz' : 'Resumen';
  });

  constructor() {
    if (this.data.task) {
      this.form.patchValue({
        title: this.data.task.title ?? '',
        type: this.data.task.type ?? 'homework',
        description: this.data.task.description ?? '',
        dueDate: this.data.task.dueDate ? new Date(this.data.task.dueDate) : null,
        scheduleEnabled: !!this.data.task.publishAt,
        publishDate: this.data.task.publishAt ? new Date(this.data.task.publishAt) : null,
        publishTime: this.data.task.publishAt
          ? new Date(this.data.task.publishAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
          : '08:00',
        maxScore: Number(this.data.task.maxScore ?? 20),
        maxAttempts: Number(this.data.task.maxAttempts ?? 1),
        lateSubmissionAllowed: !!this.data.task.lateSubmissionAllowed,
        resourceUrl: this.data.task.resourceUrl ?? '',
      });
      if (this.data.task.resourceUrl) {
        this.resourceMode.set('url');
      }
      this.questions.set(
        (this.data.task.questions ?? []).map((question) => ({
          id: question.id || crypto.randomUUID(),
          prompt: question.prompt,
          type: question.type,
          points: Number(question.points ?? 1),
          required: question.required,
          options: (question.options ?? []).map((option) => ({
            id: option.id || crypto.randomUUID(),
            label: option.label,
            isCorrect: !!option.isCorrect,
          })),
        })),
      );
    }

    this.form.controls.type.valueChanges.subscribe((value) => {
      if (value === 'quiz' && !this.questions().length) {
        this.addQuestion();
      }
    });

    this.form.controls.scheduleEnabled.valueChanges.subscribe((enabled) => {
      if (!enabled) {
        this.form.patchValue({ publishDate: null, publishTime: '08:00' }, { emitEvent: false });
      }
    });
  }

  canGoNext() {
    if (this.currentStep() === 1) {
      return !!this.form.controls.type.value;
    }
    if (this.currentStep() === 2) {
      if (!this.form.controls.title.value || !this.form.controls.dueDate.value) return false;
      if (this.form.controls.scheduleEnabled.value) {
        return !!this.form.controls.publishDate.value && !!this.form.controls.publishTime.value;
      }
      return true;
    }
    return false;
  }

  nextStep() {
    if (!this.canGoNext()) return;
    if (this.currentStep() === 1) {
      this.currentStep.set(2);
      return;
    }
    if (this.currentStep() === 2) {
      this.currentStep.set(3);
    }
  }

  previousStep() {
    if (this.currentStep() === 3) {
      this.currentStep.set(2);
      return;
    }
    if (this.currentStep() === 2) {
      this.currentStep.set(1);
    }
  }

  private createOption(label = '') {
    return { id: crypto.randomUUID(), label, isCorrect: false };
  }

  private createQuestion(): QuizQuestionDraft {
    return {
      id: crypto.randomUUID(),
      prompt: '',
      type: 'single_choice',
      points: 1,
      required: true,
      options: [this.createOption('Opción 1'), this.createOption('Opción 2')],
    };
  }

  addQuestion() {
    this.questions.update((current) => [...current, this.createQuestion()]);
  }

  removeQuestion(questionId: string) {
    this.questions.update((current) => current.filter((question) => question.id !== questionId));
  }

  updateQuestion(
    questionId: string,
    patch: Partial<Pick<QuizQuestionDraft, 'prompt' | 'type' | 'points' | 'required'>>,
  ) {
    this.questions.update((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;
        const nextType = patch.type ?? question.type;
        return {
          ...question,
          ...patch,
          type: nextType,
          options:
            nextType === 'short_answer'
              ? []
              : question.options.length
              ? question.options
              : [this.createOption('Opción 1'), this.createOption('Opción 2')],
        };
      }),
    );
  }

  addOption(questionId: string) {
    this.questions.update((current) =>
      current.map((question) =>
        question.id === questionId
          ? { ...question, options: [...question.options, this.createOption(`Opción ${question.options.length + 1}`)] }
          : question,
      ),
    );
  }

  updateOption(questionId: string, optionId: string, patch: Partial<{ label: string; isCorrect: boolean }>) {
    this.questions.update((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;

        let options = question.options.map((option) => (option.id === optionId ? { ...option, ...patch } : option));

        if (patch.isCorrect && question.type === 'single_choice') {
          options = options.map((option) => ({ ...option, isCorrect: option.id === optionId }));
        }

        return { ...question, options };
      }),
    );
  }

  removeOption(questionId: string, optionId: string) {
    this.questions.update((current) =>
      current.map((question) =>
        question.id === questionId
          ? { ...question, options: question.options.filter((option) => option.id !== optionId) }
          : question,
      ),
    );
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.api.uploadFile(file, { category: 'classroom', preserveName: true }).subscribe({
      next: (res) => {
        this.form.patchValue({ resourceUrl: res.url });
        this.resourceMode.set('file');
        this.uploading.set(false);
        input.value = '';
      },
      error: () => {
        this.uploading.set(false);
        input.value = '';
      },
    });
  }

  clearResource() {
    this.form.patchValue({ resourceUrl: '' });
    this.resourceMode.set('none');
  }

  submit() {
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    const dueDate = value.dueDate instanceof Date ? value.dueDate : value.dueDate ? new Date(value.dueDate) : null;
    const publishDate =
      value.publishDate instanceof Date ? value.publishDate : value.publishDate ? new Date(value.publishDate) : null;
    let publishAt: string | undefined;

    if (value.scheduleEnabled && publishDate) {
      const [hours, minutes] = String(value.publishTime || '08:00')
        .split(':')
        .map((part) => Number(part));
      publishDate.setHours(Number.isFinite(hours) ? hours : 8, Number.isFinite(minutes) ? minutes : 0, 0, 0);
      publishAt = publishDate.toISOString();
    }

    this.ref.close({
      title: value.title ?? '',
      type: value.type ?? 'homework',
      description: value.description ?? '',
      instructions: value.description ?? '',
      dueDate: dueDate ? dueDate.toISOString() : '',
      publishAt,
      maxScore: Number(value.maxScore ?? 20),
      maxAttempts: Number(value.maxAttempts ?? 1),
      lateSubmissionAllowed: Boolean(value.lateSubmissionAllowed),
      resourceUrl: value.resourceUrl?.trim() || undefined,
      questions:
        value.type === 'quiz'
          ? this.questions()
              .filter((question) => question.prompt.trim())
              .map((question) => ({
                prompt: question.prompt.trim(),
                type: question.type,
                points: Number(question.points || 1),
                required: question.required,
                options:
                  question.type === 'short_answer'
                    ? []
                    : question.options
                        .filter((option) => option.label.trim())
                        .map((option) => ({
                          label: option.label.trim(),
                          isCorrect: option.isCorrect,
                        })),
              }))
          : [],
    });
  }

  close() {
    this.ref.close();
  }
}
