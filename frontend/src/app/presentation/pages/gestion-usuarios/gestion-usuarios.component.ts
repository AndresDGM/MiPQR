import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateUserUseCase } from '../../../core/application/usecases/create-user.usecase';
import { GetAllUsersUseCase } from '../../../core/application/usecases/get-all-users.usecase';
import { SetUserActivoUseCase } from '../../../core/application/usecases/set-user-activo.usecase';
import { UpdateUserUseCase } from '../../../core/application/usecases/update-user.usecase';
import { User, UserRoleName } from '../../../core/domain/models/user.model';
import { EmptyStateComponent, LoadingSpinnerComponent } from '../../components/shared';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './gestion-usuarios.component.html',
  styleUrl: './gestion-usuarios.component.scss',
})
export class GestionUsuariosComponent implements OnInit {
  private getAllUsersUseCase = inject(GetAllUsersUseCase);
  private createUserUseCase = inject(CreateUserUseCase);
  private updateUserUseCase = inject(UpdateUserUseCase);
  private setUserActivoUseCase = inject(SetUserActivoUseCase);

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  feedback = signal<string | null>(null);
  users = signal<User[]>([]);

  searchTerm = signal('');
  roleFilter = signal<UserRoleName | ''>('');
  showForm = signal(false);
  editingUserId = signal<number | null>(null);

  roles: { idRol: number; nombre: UserRoleName }[] = [
    { idRol: 1, nombre: 'Solicitante' },
    { idRol: 2, nombre: 'Analista SIAU' },
    { idRol: 3, nombre: 'Responsable' },
    { idRol: 4, nombre: 'Directivo' },
  ];

  form = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(3)]),
    correo: new FormControl('', [Validators.required, Validators.email]),
    identificacion: new FormControl('', [Validators.required, Validators.minLength(6)]),
    telefono: new FormControl(''),
    idRol: new FormControl<number>(3, [Validators.required]),
    password: new FormControl(''),
  });

  filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const role = this.roleFilter();
    return this.users().filter((u) => {
      const matchRole = !role || u.rol === role;
      const matchTerm =
        !term ||
        u.nombre.toLowerCase().includes(term) ||
        u.correo.toLowerCase().includes(term) ||
        u.identificacion.toLowerCase().includes(term);
      return matchRole && matchTerm;
    });
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);
    this.getAllUsersUseCase.execute().subscribe({
      next: (list) => {
        this.users.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'No fue posible cargar los usuarios.');
        this.loading.set(false);
      },
    });
  }

  openCreateForm(): void {
    this.editingUserId.set(null);
    this.form.reset({ nombre: '', correo: '', identificacion: '', telefono: '', idRol: 3, password: '' });
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(4)]);
    this.form.controls.password.updateValueAndValidity();
    this.showForm.set(true);
    this.feedback.set(null);
    this.error.set(null);
  }

  openEditForm(user: User): void {
    this.editingUserId.set(user.idUsuario);
    this.form.reset({
      nombre: user.nombre,
      correo: user.correo,
      identificacion: user.identificacion,
      telefono: user.telefono ?? '',
      idRol: user.idRol,
      password: '',
    });
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.showForm.set(true);
    this.feedback.set(null);
    this.error.set(null);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingUserId.set(null);
  }

  saveUser(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    const editId = this.editingUserId();
    if (editId !== null) {
      this.updateUserUseCase
        .execute(editId, {
          nombre: val.nombre!.trim(),
          correo: val.correo!.trim(),
          identificacion: val.identificacion!.trim(),
          telefono: val.telefono?.trim() || null,
          idRol: Number(val.idRol),
        })
        .subscribe({
          next: (updated) => {
            this.users.update((list) =>
              list.map((u) => (u.idUsuario === editId ? updated : u))
            );
            this.feedback.set(`Usuario "${updated.nombre}" actualizado correctamente.`);
            this.saving.set(false);
            this.showForm.set(false);
          },
          error: (err) => {
            this.error.set(err.error?.error || err.message || 'Error al actualizar el usuario.');
            this.saving.set(false);
          },
        });
      return;
    }

    this.createUserUseCase
      .execute({
        nombre: val.nombre!.trim(),
        correo: val.correo!.trim(),
        identificacion: val.identificacion!.trim(),
        telefono: val.telefono?.trim() || null,
        idRol: Number(val.idRol),
        password: val.password!,
      })
      .subscribe({
        next: (created) => {
          this.users.update((list) => [created, ...list]);
          this.feedback.set(`Usuario "${created.nombre}" creado correctamente.`);
          this.saving.set(false);
          this.showForm.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.error || err.message || 'Error al crear el usuario.');
          this.saving.set(false);
        },
      });
  }

  toggleActivo(user: User): void {
    this.error.set(null);
    this.setUserActivoUseCase.execute(user.idUsuario, !user.activo).subscribe({
      next: (updated) => {
        this.users.update((list) =>
          list.map((u) => (u.idUsuario === user.idUsuario ? updated : u))
        );
        this.feedback.set(
          `Usuario "${updated.nombre}" ${updated.activo ? 'activado' : 'inactivado'}.`
        );
      },
      error: (err) => {
        this.error.set(err.error?.error || err.message || 'No se pudo cambiar el estado del usuario.');
      },
    });
  }
}
