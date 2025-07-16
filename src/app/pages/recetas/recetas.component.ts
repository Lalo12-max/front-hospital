import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown'; 
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { RecetaService } from '../../services/receta.service';
import { UsuarioService } from '../../services/usuario.service';
import { ConsultorioService } from '../../services/consultorio.service';
import { Receta, CreateRecetaRequest } from '../../models/receta.model';
import { Usuario } from '../../models/usuario.model';
import { Consultorio } from '../../models/consultorio.model';

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    DropdownModule, 
    MessageModule,
    ToastModule,
    TagModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './recetas.component.html',
  styleUrls: ['./recetas.component.css']
})
export class RecetasComponent implements OnInit {
  recetas: Receta[] = [];
  usuarios: Usuario[] = [];
  consultorios: Consultorio[] = [];
  
 
  medicos: any[] = [];
  pacientes: any[] = [];
  consultorioOptions: any[] = [];
  
  recetaForm: FormGroup;
  isModalOpen = false;
  isEditing = false;
  currentRecetaId: number | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private recetaService: RecetaService,
    private usuarioService: UsuarioService,
    private consultorioService: ConsultorioService,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.recetaForm = this.fb.group({
      fecha: ['', [Validators.required]],
      medico_id: ['', [Validators.required, Validators.min(1)]],
      paciente_id: ['', [Validators.required, Validators.min(1)]],
      consultorio_id: ['', [Validators.required, Validators.min(1)]],
      medicamento: ['', [Validators.required, Validators.minLength(3)]],
      dosis: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit(): void {
    this.loadRecetas();
    this.loadUsuarios();
    this.loadConsultorios();
  }

  loadRecetas(): void {
    this.loading = true;
    this.error = null;
    this.recetaService.getRecetas().subscribe({
      next: (recetas) => {
        this.recetas = recetas;
        this.loading = false;
        if (recetas.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Sin datos',
            detail: 'No se encontraron recetas en el sistema'
          });
        }
      },
      error: (error) => {
        this.error = 'Error al cargar las recetas';
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las recetas'
        });
        console.error('Error:', error);
      }
    });
  }

  loadUsuarios(): void {
    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        
        this.medicos = usuarios
          .filter(u => u.tipo === 'medico')
          .map(u => ({ label: u.nombre, value: u.id_usuario }));
        
        this.pacientes = usuarios
          .filter(u => u.tipo === 'paciente')
          .map(u => ({ label: u.nombre, value: u.id_usuario }));
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
      }
    });
  }

  loadConsultorios(): void {
    this.consultorioService.getConsultorios().subscribe({
      next: (consultorios) => {
        this.consultorios = consultorios;
       
        this.consultorioOptions = consultorios.map(c => ({ 
          label: c.nombre, 
          value: c.id_consultorio 
        }));
      },
      error: (error) => {
        console.error('Error al cargar consultorios:', error);
      }
    });
  }

  getMedicoNombre(medicoId: number): string {
    const medico = this.usuarios.find(u => u.id_usuario === medicoId && u.tipo === 'medico');
    return medico ? medico.nombre : 'N/A';
  }

  getPacienteNombre(pacienteId: number): string {
    const paciente = this.usuarios.find(u => u.id_usuario === pacienteId && u.tipo === 'paciente');
    return paciente ? paciente.nombre : 'N/A';
  }

  getConsultorioNombre(consultorioId: number): string {
    const consultorio = this.consultorios.find(c => c.id_consultorio === consultorioId);
    return consultorio ? consultorio.nombre : 'N/A';
  }

  openModal(receta?: Receta): void {
    this.isModalOpen = true;
    this.isEditing = !!receta;
    this.currentRecetaId = receta?.id_receta || null;
    this.error = null;
    
    if (receta) {
      const fechaFormatted = new Date(receta.fecha).toISOString().split('T')[0];
      this.recetaForm.patchValue({
        fecha: fechaFormatted,
        medico_id: receta.medico_id,
        paciente_id: receta.paciente_id,
        consultorio_id: receta.consultorio_id,
        medicamento: receta.medicamento,
        dosis: receta.dosis
      });
    } else {
      this.recetaForm.reset();
      const today = new Date().toISOString().split('T')[0];
      this.recetaForm.patchValue({ fecha: today });
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isEditing = false;
    this.currentRecetaId = null;
    this.recetaForm.reset();
    this.error = null;
  }

  onSubmit(): void {
    if (this.recetaForm.valid) {
      this.loading = true;
      this.error = null;
      const recetaData: CreateRecetaRequest = {
        ...this.recetaForm.value,
        fecha: new Date(this.recetaForm.value.fecha)
      };

      if (this.isEditing && this.currentRecetaId) {
        this.recetaService.updateReceta(this.currentRecetaId, recetaData).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Receta actualizada correctamente'
            });
            this.loadRecetas();
            this.closeModal();
            this.loading = false;
          },
          error: (error) => {
            this.error = 'Error al actualizar la receta';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo actualizar la receta'
            });
            this.loading = false;
            console.error('Error:', error);
          }
        });
      } else {
        this.recetaService.createReceta(recetaData).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Receta creada correctamente'
            });
            this.loadRecetas();
            this.closeModal();
            this.loading = false;
          },
          error: (error) => {
            this.error = 'Error al crear la receta';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo crear la receta'
            });
            this.loading = false;
            console.error('Error:', error);
          }
        });
      }
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario inválido',
        detail: 'Por favor, complete todos los campos requeridos'
      });
    }
  }

  deleteReceta(id: number): void {
    this.messageService.clear();
    this.messageService.add({
      key: 'confirm',
      sticky: true,
      severity: 'warn',
      summary: 'Confirmar eliminación',
      detail: '¿Estás seguro de que quieres eliminar esta receta?',
      data: id
    });
  }

  confirmDelete(id: number): void {
    this.loading = true;
    this.recetaService.deleteReceta(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Receta eliminada correctamente'
        });
        this.loadRecetas();
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar la receta'
        });
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES');
  }
}