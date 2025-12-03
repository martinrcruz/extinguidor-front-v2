import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { FacturacionService, CreateFacturacionDto } from 'src/app/services/facturacion.service';
import { RutasService } from 'src/app/services/rutas.service';
import { PartesService } from 'src/app/services/partes.service';

@Component({
  selector: 'app-form-facturacion',
  standalone: false,
  templateUrl: './form-facturacion.component.html',
  styleUrls: ['./form-facturacion.component.scss']
})
export class FormFacturacionComponent implements OnInit {

  facturacionForm!: FormGroup;
  isEdit = false;
  facturacionId: string | null = null;

  // Listas para selectores
  rutasDisponibles: any[] = [];
  partesDisponibles: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private _facturacion: FacturacionService,
    private _rutas: RutasService,
    private _partes: PartesService
  ) {}

  ngOnInit() {
    this.initForm();
    
    // Obtener el ID de la ruta primero
    this.route.paramMap.subscribe(params => {
      this.facturacionId = params.get('id');
      console.log('ID de facturación obtenido de la ruta:', this.facturacionId);
      
      if (this.facturacionId) {
        this.isEdit = true;
        // Cargar rutas y partes primero, luego cargar la facturación
        this.cargarRutasYPartes().then(() => {
          this.cargarFacturacion(this.facturacionId!);
        });
      } else {
        // Si no hay ID, solo cargar rutas y partes (modo creación)
        this.cargarRutasYPartes();
      }
    });
  }

  initForm() {
    this.facturacionForm = this.fb.group({
      facturacion:  [0, Validators.required],
      ruta:         ['', Validators.required],
      parte:        ['', Validators.required]
    });
  }

  /**
   * Normaliza el ID de un objeto (convierte id a _id como string)
   */
  private normalizarId(obj: any): string {
    if (!obj) return '';
    if (obj._id) return obj._id.toString();
    if (obj.id !== undefined && obj.id !== null) return obj.id.toString();
    return '';
  }

  async cargarRutasYPartes(): Promise<void> {
    try {
      // Cargar rutas y partes en paralelo
      const rutasPromise = new Promise<void>((resolve) => {
        this._rutas.getRutas().subscribe({
          next: (rutas: any[]) => {
            // Normalizar IDs de rutas
            this.rutasDisponibles = Array.isArray(rutas) 
              ? rutas.map(r => ({ ...r, _id: this.normalizarId(r) }))
              : [];
            resolve();
          },
          error: (error) => {
            console.error('Error al cargar rutas:', error);
            this.rutasDisponibles = [];
            resolve();
          }
        });
      });

      const partesPromise = new Promise<void>((resolve) => {
        this._partes.getPartes().subscribe({
          next: (res: any) => {
            console.log('Partes cargadas:', res);
            let partes: any[] = [];
            if (res.partes && Array.isArray(res.partes)) {
              partes = res.partes;
            } else if (res.data?.partes && Array.isArray(res.data.partes)) {
              partes = res.data.partes;
            }
            // Normalizar IDs de partes
            this.partesDisponibles = partes.map(p => ({ ...p, _id: this.normalizarId(p) }));
            resolve();
          },
          error: (error) => {
            console.error('Error al cargar partes:', error);
            this.partesDisponibles = [];
            resolve();
          }
        });
      });

      await Promise.all([rutasPromise, partesPromise]);
    } catch (error) {
      console.error('Error al cargar rutas y partes:', error);
    }
  }

 async cargarFacturacion(id: string) {
  if (!id || id === 'undefined') {
    console.error('Error: ID de facturación no válido:', id);
    return;
  }

  console.log('Cargando facturación con ID:', id);
  const req = this._facturacion.getFacturacionById(id);
  req.subscribe({
    next: (res: any) => {
      console.log('Facturación cargada:', res);
      if (!(res?.ok && res.data?.facturacion)) {
        console.error('Error: Respuesta inválida al cargar facturación');
        return;
      }

      const f = res.data.facturacion;
      const rutaId = this.normalizarId(f.ruta);
      const parteId = this.normalizarId(f.parte);

      console.log('IDs normalizados - Ruta:', rutaId, 'Parte:', parteId);

      /* ▸ Garantizar que la ruta y el parte existan en sus arrays
         (por si aún no se han cargado desde el backend) */
      if (rutaId && !this.rutasDisponibles.some(r => this.normalizarId(r) === rutaId)) {
        const rutaNormalizada = { ...f.ruta, _id: rutaId };
        this.rutasDisponibles.push(rutaNormalizada);
      }
      if (parteId && !this.partesDisponibles.some(p => this.normalizarId(p) === parteId)) {
        const parteNormalizado = { ...f.parte, _id: parteId };
        this.partesDisponibles.push(parteNormalizado);
      }

      /* ▸ Cargar datos en el formulario */
      this.facturacionForm.patchValue({
        facturacion: f.facturacion,
        ruta:        rutaId,   // solo el _id
        parte:       parteId   // solo el _id
      });
    },
    error: (error) => {
      console.error('Error al cargar facturación:', error);
    }
  });
}

  /**
   * Obtiene el ID de un valor, manejando tanto IDs directos como texto descriptivo
   */
  private obtenerId(valor: any, tipo: 'ruta' | 'parte'): string {
    // Si es null o undefined, retornar vacío
    if (!valor) return '';
    
    // Si es un objeto, normalizar su ID
    if (typeof valor === 'object') {
      return this.normalizarId(valor);
    }
    
    // Si es un string
    if (typeof valor === 'string') {
      const valorTrimmed = valor.trim();
      
      // Si parece ser un ID (solo números o formato de ID)
      // Los IDs suelen ser números o strings cortos sin espacios
      if (!valorTrimmed.includes(' ') && !valorTrimmed.includes('-') && valorTrimmed.length < 20) {
        return valorTrimmed;
      }
      
      // Si parece ser texto descriptivo, buscar el objeto correspondiente
      if (tipo === 'ruta') {
        const rutaEncontrada = this.rutasDisponibles.find(r => {
          const rutaName = r.name?.name || '';
          const rutaDate = r.date || '';
          // Comparar sin espacios y normalizando formato
          const displayText = `${rutaName} - ${rutaDate}`.trim();
          return displayText === valorTrimmed || displayText.includes(valorTrimmed) || valorTrimmed.includes(displayText);
        });
        if (rutaEncontrada) {
          return this.normalizarId(rutaEncontrada);
        }
      } else if (tipo === 'parte') {
        const parteEncontrado = this.partesDisponibles.find(p => {
          const parteDesc = (p.description || '').trim();
          return parteDesc === valorTrimmed || parteDesc.includes(valorTrimmed) || valorTrimmed.includes(parteDesc);
        });
        if (parteEncontrado) {
          return this.normalizarId(parteEncontrado);
        }
      }
      
      // Si no se encontró, retornar el valor original (por si acaso es un ID válido)
      return valorTrimmed;
    }
    
    // Para otros tipos (números, etc.), convertir a string
    return valor?.toString() || '';
  }

async guardar() {
  if (this.facturacionForm.invalid) {
    console.warn('Formulario inválido:', this.facturacionForm.errors);
    return;
  }

  try {
    const formValue = this.facturacionForm.value;
    
    // Obtener los IDs correctos usando el método helper
    const rutaId = this.obtenerId(formValue.ruta, 'ruta');
    const parteId = this.obtenerId(formValue.parte, 'parte');
    
    // Validar que los IDs sean válidos
    if (!rutaId) {
      console.error('Error: No se pudo obtener el ID de la ruta');
      return;
    }
    
    if (!parteId) {
      console.error('Error: No se pudo obtener el ID del parte');
      return;
    }
    
    // Preparar datos para enviar (solo IDs como números)
    // Convertir los IDs de string a número para el backend
    const rutaIdNum = parseInt(rutaId, 10);
    const parteIdNum = parseInt(parteId, 10);
    
    if (isNaN(rutaIdNum)) {
      console.error('Error: ID de ruta no es un número válido:', rutaId);
      return;
    }
    
    if (isNaN(parteIdNum)) {
      console.error('Error: ID de parte no es un número válido:', parteId);
      return;
    }
    
    const data: CreateFacturacionDto = {
      facturacion: formValue.facturacion,
      rutaId: rutaIdNum,
      parteId: parteIdNum
    };
    
    console.log('Datos a enviar:', data);
    console.log('Valores originales del formulario:', formValue);

    if (!this.isEdit) {
      const req = await this._facturacion.createFacturacion(data);
      req.subscribe({
        next: (resp) => {
          if (resp.ok) {
            this.navCtrl.navigateRoot('/facturacion');
          } else {
            console.error('Error al crear facturación:', resp.error);
          }
        },
        error: (error) => {
          console.error('Error al crear facturación:', error);
        }
      });
    } else if (this.facturacionId) {
      const req = await this._facturacion.updateFacturacion(this.facturacionId, data);
      req.subscribe({
        next: (resp) => {
          if (resp.ok) {
            this.navCtrl.navigateRoot('/facturacion');
          } else {
            console.error('Error al actualizar facturación:', resp.error);
          }
        },
        error: (error) => {
          console.error('Error al actualizar facturación:', error);
        }
      });
    }
  } catch (error) {
    console.error('Error guardando facturación:', error);
  }
}
}
