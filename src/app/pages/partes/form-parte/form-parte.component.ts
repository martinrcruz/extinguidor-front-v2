import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { PartesService } from 'src/app/services/partes.service';
import { RutasService } from 'src/app/services/rutas.service';
import { CustomerService } from 'src/app/services/customer.service';
import { ArticuloService } from 'src/app/services/articulo.service';
import { Articulo } from 'src/app/models/articulo.model';
import { isoDateOnly, parseDateAsLocal } from 'src/app/shared/utils/date.utils';

@Component({
  selector: 'app-form-parte',
  standalone: false,
  templateUrl: './form-parte.component.html',
  styleUrls: ['./form-parte.component.scss']
})
export class FormParteComponent implements OnInit {

  parteForm!: FormGroup;
  isEdit = false;
  parteId: string | null = null;
  documentos: File[] = [];
  articulos: Articulo[] = [];

  // Listas para selects
  customersList: any[] = [];   // "Customer" unificado
  rutasDisponibles: any[] = [];
  rutasLoading: boolean = false; // Flag para indicar carga de rutas

  customers: any[] = []; // lista de clientes
  minDate: string = '';  // p.ej. '2023-08-01'

  clientModalOpen = false;
  filteredCustomers: any[] = [];
  searchClientTxt: string = '';
  customersLoading: boolean = false; // Flag para indicar carga de clientes
  
  // Flag para evitar disparar el listener durante la carga inicial
  isLoadingParte = false;

  // Modal de artículos
  articulosModalOpen = false;
  searchArticuloTxt: string = '';
  articulosSeleccionados: Articulo[] = [];
  
  // Paginación para el modal de artículos
  articulosCurrentPage: number = 1;
  articulosItemsPerPage: number = 50; // Menos elementos para el modal
  articulosPagination: any = null;
  articulosLoading: boolean = false;

  // Para usar Math en el template
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private _parte: PartesService,
    private _rutas: RutasService,
    private _customer: CustomerService,
    private _articulos: ArticuloService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.initForm();

    this.route.paramMap.subscribe(params => {
      this.parteId = params.get('id');
      if (this.parteId) {
        this.isEdit = true;
        // Cargar el parte primero para obtener su fecha
        this.loadParte(this.parteId);
      } else {
        // Si no estamos editando, establecer fecha inicial (mes actual) y cargar rutas
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const initialDate = `${year}-${month}-${day}`;
        
        // Establecer fecha inicial en el formulario
        this.parteForm.patchValue({ date: initialDate }, { emitEvent: false });
        
        // Forzar detección de cambios para mostrar el loader
        this.cdr.detectChanges();
        
        // Cargar rutas del mes actual
        this.loadRutasByDate(initialDate);
      }
    });
    
    this.loadCustomers();
    this.loadArticulos();
    
    // Listener para detectar cambios en la fecha y actualizar rutas disponibles
    this.parteForm.get('date')?.valueChanges.subscribe(date => {
      // Solo cargar rutas si no se está cargando un parte (evita disparo durante carga inicial)
      if (date && !this.isLoadingParte) {
        this.loadRutasByDate(date);
      }
    });
  }

  initForm() {
    this.parteForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      address: ['', Validators.required],
      facturacion: [0],
      state: ['Pendiente', Validators.required],
      type: ['Mantenimiento', Validators.required],
      categoria: ['Extintores', Validators.required],
      date: ['', Validators.required],
      customer: ['', Validators.required],
      ruta: [''],
      coordinationMethod: ['Coordinar según horarios'],
      gestiona: [0],
      periodico: [false],
      frequency: ['Mensual'],
      endDate: [''],
      articulos: this.fb.array([])
    });
  }

  get articulosFormArray() {
    return this.parteForm.get('articulos') as FormArray;
  }

  get hasDateSelected(): boolean {
    const date = this.parteForm.get('date')?.value;
    return !!date && date !== '';
  }

  crearArticuloFormGroup() {
    return this.fb.group({
      cantidad: [1, Validators.required],
      codigo: ['', Validators.required],
      grupo: ['', Validators.required],
      familia: ['', Validators.required],
      descripcionArticulo: ['', Validators.required],
      precioVenta: [0, Validators.required],
      articuloId: [''] // Campo para guardar referencia al artículo original
    });
  }

  agregarArticuloExistente(articulo: Articulo) {
    const articuloForm = this.crearArticuloFormGroup();
    articuloForm.patchValue({
      cantidad: 1,
      codigo: articulo.codigo,
      grupo: articulo.grupo,
      familia: articulo.familia,
      descripcionArticulo: articulo.descripcionArticulo,
      precioVenta: articulo.precioVenta,
      articuloId: articulo._id
    });
    this.articulosFormArray.push(articuloForm);
  }

  eliminarArticulo(index: number) {
    this.articulosFormArray.removeAt(index);
  }

  async loadArticulos(page: number = 1, search: string = '') {
    this.articulosLoading = true;
    this.articulosCurrentPage = page;
    
    try {
      const req = await this._articulos.getArticulos(page, this.articulosItemsPerPage, search);
      req.subscribe((res: any) => {
        if (res.ok && res.articulos) {
          this.articulos = res.articulos;
          this.articulosPagination = res.pagination;
          this.scrollModalToTop();
        }
        this.articulosLoading = false;
      }, (error) => {
        console.error('Error al cargar artículos:', error);
        this.articulosLoading = false;
      });
    } catch (error) {
      console.error('Error:', error);
      this.articulosLoading = false;
    }
  }

  async loadCustomers(showLoader: boolean = false) {
    // Solo mostrar loader si se solicita explícitamente (cuando el modal está abierto)
    if (showLoader) {
      this.customersLoading = true;
      // Forzar detección de cambios para mostrar el loader inmediatamente
      this.cdr.detectChanges();
    }
    
    try {
      const customers = await firstValueFrom(this._customer.getCustomers());
      
      // Normalizar los IDs: asegurar que cada cliente tenga tanto id como _id
      this.customersList = (customers || []).map((c: any) => ({
        ...c,
        _id: c._id || c.id?.toString() || String(c.id),
        id: c.id || (c._id ? parseInt(c._id, 10) : c.id)
      }));
      
      // Filtrar solo clientes activos si existe el campo active
      this.customersList = this.customersList.filter((c: any) => c.active !== false);
      
      this.filteredCustomers = [...this.customersList];
      
      if (showLoader) {
        this.customersLoading = false;
      }
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
      
      // Si el modal está abierto, actualizar también
      if (this.clientModalOpen) {
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 100);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      this.customersList = [];
      this.filteredCustomers = [];
      if (showLoader) {
        this.customersLoading = false;
      }
      this.cdr.detectChanges();
    }
  }

  async loadRutas() {
    this.rutasLoading = true;
    this.cdr.detectChanges();
    
    // Generamos la fecha "YYYY-MM-01" para el mes actual
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const firstDayOfMonth = `${year}-${month}-01`;

    // Llamamos a getRutasDisponibles(firstDayOfMonth)
    const rReq = await this._rutas.getRutasDisponibles(firstDayOfMonth);
    rReq.subscribe({
      next: (rutas: any[]) => {
        // El servicio ya procesó la respuesta y devuelve directamente el array
        this.rutasDisponibles = rutas || [];
        this.rutasLoading = false;
        this.cdr.detectChanges();
        console.log('Rutas cargadas:', this.rutasDisponibles.length);
      },
      error: (error) => {
        console.error('Error al cargar rutas:', error);
        this.rutasDisponibles = [];
        this.rutasLoading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        // Asegurar que siempre se desactive el loading al completar
        if (this.rutasLoading) {
          this.rutasLoading = false;
          this.cdr.detectChanges();
        }
      }
    });
  }

  async loadRutasByDate(selectedDate: string) {
    if (!selectedDate) {
      this.rutasLoading = false;
      this.cdr.detectChanges();
      return;
    }
    
    this.rutasLoading = true;
    // Forzar detección de cambios para mostrar el loader inmediatamente
    this.cdr.detectChanges();
    
    // Timeout de seguridad para evitar carga infinita (10 segundos)
    let loadingTimeout: any = setTimeout(() => {
      if (this.rutasLoading) {
        console.warn('Timeout al cargar rutas, desactivando loader');
        this.rutasLoading = false;
        this.cdr.detectChanges();
      }
    }, 10000);
    
    // Función helper para limpiar el timeout y desactivar loading
    const finishLoading = () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
      this.rutasLoading = false;
      this.cdr.detectChanges();
    };
    
    // Convertir la fecha seleccionada al primer día del mes
    const dateObj = parseDateAsLocal(selectedDate) || new Date(selectedDate);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const firstDayOfMonth = `${year}-${month}-01`;

    // Limpiar las rutas anteriores para evitar duplicados
    this.rutasDisponibles = [];

    // Cargar rutas del mes seleccionado
    try {
      const rReq = this._rutas.getRutasDisponibles(firstDayOfMonth);
      
      // Calcular si necesitamos cargar también el mes actual
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const firstDayCurrentMonth = `${currentYear}-${currentMonth}-01`;
      const needsCurrentMonth = firstDayCurrentMonth !== firstDayOfMonth;
      
      let firstRequestDone = false;
      let secondRequestDone = false;
      
      const checkAndFinish = () => {
        if (firstRequestDone && (!needsCurrentMonth || secondRequestDone)) {
          finishLoading();
        }
      };
      
      rReq.subscribe({
        next: (rutas: any[]) => {
          // El servicio ya procesó la respuesta y devuelve directamente el array
          this.rutasDisponibles = rutas || [];
          console.log('Rutas cargadas para el mes seleccionado:', this.rutasDisponibles.length);
          firstRequestDone = true;

          // También cargar rutas del mes actual si es diferente
          if (needsCurrentMonth) {
            const req2 = this._rutas.getRutasDisponibles(firstDayCurrentMonth);
            req2.subscribe({
              next: (rutasActuales: any[]) => {
                // Agregar rutas que no estén ya en la lista
                (rutasActuales || []).forEach((ruta: any) => {
                  const rutaId = ruta._id || ruta.id;
                  if (!this.rutasDisponibles.find(r => (r._id || r.id) === rutaId)) {
                    this.rutasDisponibles.push(ruta);
                  }
                });
                console.log('Rutas disponibles totales:', this.rutasDisponibles.length);
              },
              error: (error) => {
                console.error('Error al cargar rutas del mes actual:', error);
                secondRequestDone = true;
                checkAndFinish();
              },
              complete: () => {
                secondRequestDone = true;
                checkAndFinish();
              }
            });
          } else {
            // Si es el mismo mes, ya terminamos
            checkAndFinish();
          }
        },
        error: (error) => {
          console.error('Error al cargar rutas:', error);
          this.rutasDisponibles = [];
          firstRequestDone = true;
          checkAndFinish();
        },
        complete: () => {
          firstRequestDone = true;
          checkAndFinish();
        }
      });
    } catch (error) {
      console.error('Error al cargar rutas:', error);
      this.rutasDisponibles = [];
      finishLoading();
    }
  }

  async loadRutasForParte(parteDate: string, rutaAsignada: any) {
    this.rutasLoading = true;
    this.cdr.detectChanges();
    
    // Cargar rutas del mes del parte
    const parteDateObj = parseDateAsLocal(parteDate);
    if (!parteDateObj) {
      this.rutasLoading = false;
      this.cdr.detectChanges();
      return;
    }
    const year = parteDateObj.getFullYear();
    const month = String(parteDateObj.getMonth() + 1).padStart(2, '0');
    const firstDayOfMonth = `${year}-${month}-01`;

    // Cargar rutas del mes del parte
    const req = await this._rutas.getRutasDisponibles(firstDayOfMonth);
    req.subscribe({
      next: (rutas: any[]) => {
        // El servicio ya procesó la respuesta y devuelve directamente el array
        this.rutasDisponibles = [...(rutas || [])];
        console.log('Rutas cargadas para el mes del parte:', this.rutasDisponibles.length);

        // Si hay una ruta asignada, asegurarse de que esté en la lista
        if (rutaAsignada) {
          const rutaId = rutaAsignada._id || rutaAsignada.id || rutaAsignada;
          const rutaExists = this.rutasDisponibles.find(r => (r._id || r.id) === rutaId);
          if (!rutaExists && (rutaAsignada._id || rutaAsignada.id)) {
            // Si la ruta no está en la lista, agregarla
            this.rutasDisponibles.push(rutaAsignada);
          }
        }

        // También cargar rutas del mes actual
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const firstDayCurrentMonth = `${currentYear}-${currentMonth}-01`;

        // Solo cargar si es diferente al mes del parte
        if (firstDayCurrentMonth !== firstDayOfMonth) {
          const req2 = this._rutas.getRutasDisponibles(firstDayCurrentMonth);
          req2.subscribe({
            next: (rutasActuales: any[]) => {
              // Agregar rutas que no estén ya en la lista
              (rutasActuales || []).forEach((ruta: any) => {
                const rutaId = ruta._id || ruta.id;
                if (!this.rutasDisponibles.find(r => (r._id || r.id) === rutaId)) {
                  this.rutasDisponibles.push(ruta);
                }
              });
              this.rutasLoading = false;
              this.cdr.detectChanges();
              console.log('Rutas disponibles totales:', this.rutasDisponibles.length);
            },
            error: (error) => {
              console.error('Error al cargar rutas del mes actual:', error);
              this.rutasLoading = false;
              this.cdr.detectChanges();
            },
            complete: () => {
              // Asegurar que siempre se desactive el loading al completar
              if (this.rutasLoading) {
                this.rutasLoading = false;
                this.cdr.detectChanges();
              }
            }
          });
        } else {
          this.rutasLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error al cargar rutas del mes del parte:', error);
        this.rutasDisponibles = [];
        this.rutasLoading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        // Asegurar que siempre se desactive el loading al completar
        if (this.rutasLoading) {
          this.rutasLoading = false;
          this.cdr.detectChanges();
        }
      }
    });
  }

  async loadParte(id: string) {
    this.isLoadingParte = true; // Activar flag para evitar disparo del listener
    
    const req = this._parte.getParteById(id);
    req.subscribe({
      next: (p: any) => {
        if (!p) {
          this.isLoadingParte = false;
          return;
        }

        const fechaIso = p.date ? isoDateOnly(p.date) : '';

        console.log('Parte cargado:', p);
        console.log('Ruta del parte:', p.ruta);
        console.log('Cliente del parte:', p.customer);

        // Manejar customer ID (puede ser objeto o ID directo)
        const customerId = p.customer?._id || p.customer?.id?.toString() || p.customer || '';
        
        // Manejar ruta ID (puede ser objeto o ID directo)
        const rutaId = p.ruta?._id || p.ruta?.id?.toString() || p.ruta || '';
        
        // Mapear coordinationMethod desde enum del backend a string del frontend
        const mapCoordinationMethodFromBackend = (method: string): string => {
          const mapping: { [key: string]: string } = {
            'LLAMAR_ANTES': 'Llamar antes',
            'COORDINAR_EMAIL': 'Coordinar por email',
            'COORDINAR_HORARIOS': 'Coordinar según horarios'
          };
          return mapping[method] || method || 'Coordinar según horarios';
        };
        
        // Normalizar el ID de la ruta para el select
        const normalizedRutaId = rutaId ? rutaId.toString() : '';

        /* ----------- rellenar FormGroup ----------- */
        // Convertir periodico a booleano explícitamente
        const periodicoValue = p.periodico === true || p.periodico === 'true' || p.periodico === 1;
        
        this.parteForm.patchValue({
          title: p.title ?? '',
          description: p.description ?? '',
          address: p.address ?? '',
          facturacion: p.facturacion ?? 0,
          state: p.state ?? '',
          type: p.type ?? '',
          categoria: p.categoria ?? '',
          date: fechaIso,
          customer: customerId,
          ruta: normalizedRutaId,
          coordinationMethod: mapCoordinationMethodFromBackend(p.coordinationMethod || ''),
          gestiona: p.gestiona ?? 0,
          periodico: periodicoValue,
          frequency: p.frequency ?? 'Mensual',
          endDate: p.endDate ? isoDateOnly(p.endDate) : ''
        });

        /* mostrar el nombre del cliente en el input de búsqueda */
        this.searchClientTxt = p.customer?.name ?? '';
        
        // Buscar el cliente en la lista para asegurar que esté disponible
        if (customerId) {
          const customerInList = this.customersList.find(c => 
            (c._id || c.id?.toString()) === customerId.toString()
          );
          if (!customerInList && p.customer) {
            // Si el cliente no está en la lista, agregarlo
            this.customersList.push({
              ...p.customer,
              _id: customerId.toString(),
              id: typeof customerId === 'string' ? parseInt(customerId, 10) : customerId
            });
            this.filteredCustomers = [...this.customersList];
          }
        }

        // Cargar rutas del mes del parte y también del mes actual
        this.loadRutasForParte(p.date, p.ruta);

        /* ----------- cargar artículos si existen ----------- */
        if (p.articulos?.length) {
          /* vaciamos el array por si ya hay items */
          while (this.articulosFormArray.length) this.articulosFormArray.removeAt(0);

          p.articulos.forEach((a: any) => {
            const g = this.crearArticuloFormGroup();
            g.patchValue({
              cantidad: a.cantidad ?? 0,
              codigo: a.codigo ?? '',
              grupo: a.grupo ?? '',
              familia: a.familia ?? '',
              descripcionArticulo: a.descripcionArticulo ?? '',
              precioVenta: a.precioVenta ?? 0,
              articuloId: a.articuloId || a._id || a.id?.toString() || ''
            });
            this.articulosFormArray.push(g);
          });
        }
        
        this.isLoadingParte = false; // Desactivar flag después de cargar
      },
      error: (error) => {
        console.error('Error al cargar parte:', error);
        this.isLoadingParte = false;
      }
    });
  }

  async onSave() {
    if (this.parteForm.invalid) return;

    const data = this.parteForm.value;

    // Verificar en front date >= minDate
    const fechaData = parseDateAsLocal(data.date);
    const fechaMin = parseDateAsLocal(this.minDate);
    // if (!fechaData || !fechaMin || fechaData < fechaMin) {
    //   console.error('Fecha anterior al mes actual');
    //   return;
    // }

    // Función para mapear coordinationMethod a enum del backend
    const mapCoordinationMethod = (method: string): string => {
      const mapping: { [key: string]: string } = {
        'Llamar antes': 'LLAMAR_ANTES',
        'Coordinar por email': 'COORDINAR_EMAIL',
        'Coordinar según horarios': 'COORDINAR_HORARIOS'
      };
      return mapping[method] || method;
    };

    // Función para convertir ID a número
    const toLongId = (id: any): number | null => {
      if (!id || id === '') return null;
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      return isNaN(numId) ? null : numId;
    };

    if (!this.isEdit) {
      const body: any = { ...this.parteForm.value };
      
      // Mapear customer a customerId (Long)
      const customerId = toLongId(body.customer);
      if (!customerId) {
        console.error('El cliente es obligatorio');
        return;
      }
      body.customerId = customerId;
      delete body.customer;
      
      // Mapear ruta a rutaId (Long) - opcional
      if (body.ruta && body.ruta !== '') {
        const rutaId = toLongId(body.ruta);
        if (rutaId) {
          body.rutaId = rutaId;
        } else {
          delete body.rutaId;
        }
      } else {
        delete body.rutaId;
      }
      delete body.ruta;
      
      // Mapear coordinationMethod a enum
      if (body.coordinationMethod) {
        body.coordinationMethod = mapCoordinationMethod(body.coordinationMethod);
      }
      
      // Limpiar campos opcionales
      if (!body.endDate || body.endDate === '') delete body.endDate;
      if (!body.frequency || body.frequency === '') delete body.frequency;
      
      // Limpiar articuloId de cada artículo antes de enviar
      if (body.articulos && Array.isArray(body.articulos)) {
        body.articulos = body.articulos.map((articulo: any) => {
          const { articuloId, ...articuloClean } = articulo;
          return articuloClean;
        });
      }
      
      // Crear parte
      console.log('Enviando datos al backend:', JSON.stringify(body, null, 2));
      const req = await this._parte.createParte(body);
      req.subscribe((resp: any) => {
        console.log('Respuesta del backend:', resp);
        // El servicio ya transforma la respuesta, si llegamos aquí es exitoso
        if (resp) {
          this.navCtrl.navigateRoot('/partes');
        }
      }, (error) => {
        console.error('Error en la petición:', error);
      });
    } else {
      // Actualizar parte
      const body: any = { ...this.parteForm.value };
      
      // Mapear customer a customerId (Long)
      const customerId = toLongId(body.customer);
      if (!customerId) {
        console.error('El cliente es obligatorio');
        return;
      }
      body.customerId = customerId;
      delete body.customer;
      
      // Mapear ruta a rutaId (Long) - opcional
      if (body.ruta && body.ruta !== '') {
        const rutaId = toLongId(body.ruta);
        if (rutaId) {
          body.rutaId = rutaId;
        } else {
          delete body.rutaId;
        }
      } else {
        delete body.rutaId;
      }
      delete body.ruta;
      
      // Mapear coordinationMethod a enum
      if (body.coordinationMethod) {
        body.coordinationMethod = mapCoordinationMethod(body.coordinationMethod);
      }
      
      // Limpiar campos opcionales
      if (!body.endDate || body.endDate === '') delete body.endDate;
      if (!body.frequency || body.frequency === '') delete body.frequency;
      
      // Limpiar articuloId de cada artículo antes de enviar
      if (body.articulos && Array.isArray(body.articulos)) {
        body.articulos = body.articulos.map((articulo: any) => {
          const { articuloId, ...articuloClean } = articulo;
          return articuloClean;
        });
      }
      
      // El ID se pasa en la URL, no en el body para update
      const req = await this._parte.updateParte(this.parteId!, body);
      req.subscribe((resp: any) => {
        console.log('Respuesta del backend al actualizar:', resp);
        // El servicio ya transforma la respuesta, si llegamos aquí es exitoso
        if (resp) {
          this.navCtrl.navigateRoot('/partes');
        }
      }, (error) => {
        console.error('Error en la petición:', error);
      });
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    for (let f of files) {
      this.documentos.push(f);
    }
  }
  removeDoc(doc: File) {
    this.documentos = this.documentos.filter(d => d !== doc);
  }

  openClientModal() {
    // Abrir el modal primero para mostrar el loader
    this.clientModalOpen = true;
    this.cdr.detectChanges();
    
    // Asegurarse de que filteredCustomers tenga todos los clientes cuando se abre el modal
    // Si no hay clientes cargados, cargarlos primero
    if (this.customersList.length === 0) {
      // Cargar clientes mostrando el loader
      this.loadCustomers(true).then(() => {
        this.filteredCustomers = [...this.customersList];
        this.searchClientTxt = ''; // Limpiar búsqueda
        this.cdr.detectChanges();
      });
    } else {
      // Actualizar filteredCustomers antes de abrir el modal
      this.filteredCustomers = [...this.customersList];
      this.searchClientTxt = ''; // Limpiar búsqueda
      this.customersLoading = false; // Asegurar que no esté en loading si ya hay clientes
      this.cdr.detectChanges();
    }
  }
  closeClientModal() {
    this.clientModalOpen = false;
  }

  filterCustomers(event: any) {
    const txt = this.searchClientTxt.toLowerCase().trim();
    if (!txt) {
      this.filteredCustomers = [...this.customersList];
      return;
    }
    this.filteredCustomers = this.customersList.filter(c =>
      (c.name && c.name.toLowerCase().includes(txt)) ||
      (c.nifCif && c.nifCif.toLowerCase().includes(txt))
    );
  }

  selectCustomer(c: any) {
    // Asignamos al form - manejar tanto _id como id
    const customerId = c._id || c.id || c;
    this.parteForm.patchValue({ customer: customerId });
    this.searchClientTxt = c.name || ''; // para mostrarlo en el IonInput
    this.clientModalOpen = false;
  }

  trackByCustomerId(index: number, customer: any): any {
    return customer._id || customer.id || index;
  }

  trackByRutaId(index: number, ruta: any): any {
    return ruta._id || ruta.id || index;
  }

  getRutaId(ruta: any): string {
    return (ruta._id || ruta.id || '').toString();
  }

  getRutaDisplayName(ruta: any): string {
    if (ruta.name?.name) {
      return ruta.name.name;
    }
    if (typeof ruta.name === 'string') {
      return ruta.name;
    }
    return 'Sin nombre';
  }

  cancel() {
    this.navCtrl.back();
  }

  openArticulosModal() {
    this.articulosModalOpen = true;
    this.loadArticulos(1); // Cargar primera página
  }

  closeArticulosModal() {
    this.articulosModalOpen = false;
  }

  filterArticulos(event: any) {
    const search = event.detail.value || '';
    this.searchArticuloTxt = search;
    this.loadArticulos(1, search); // Recargar desde la primera página con búsqueda
  }

  selectArticulo(articulo: Articulo) {
    this.agregarArticuloExistente(articulo);
    // Opcional: puedes cerrar el modal al seleccionar un artículo
    // o dejarlo abierto para permitir seleccionar varios
    // this.closeArticulosModal();
  }

  selectMultipleArticulos() {
    for (const articulo of this.articulosSeleccionados) {
      this.agregarArticuloExistente(articulo);
    }
    this.articulosSeleccionados = [];
    this.closeArticulosModal();
  }

  toggleArticuloSelection(articulo: Articulo, event: any) {
    if (event.detail.checked) {
      // Agregar a seleccionados si no está ya
      if (!this.articulosSeleccionados.find(a => a._id === articulo._id)) {
        this.articulosSeleccionados.push(articulo);
      }
    } else {
      // Remover de seleccionados
      this.articulosSeleccionados = this.articulosSeleccionados.filter(a => a._id !== articulo._id);
    }
  }

  // Método para hacer scroll to top en el modal
  private scrollModalToTop() {
    console.log('scrollModalToTop llamado');
    
    setTimeout(() => {
      // Método 1: Buscar el contenido del modal activo
      const modalContent = document.querySelector('ion-modal.show-modal ion-content');
      if (modalContent) {
        console.log('Usando modal content scroll');
        modalContent.scrollTop = 0;
      } else {
        // Método 2: Buscar cualquier modal abierto
        const anyModalContent = document.querySelector('ion-modal ion-content');
        if (anyModalContent) {
          console.log('Usando any modal content scroll');
          anyModalContent.scrollTop = 0;
        } else {
          // Método 3: Buscar por clase específica del modal
          const articulosList = document.querySelector('.modal-content ion-list');
          if (articulosList) {
            console.log('Usando articulos list scroll');
            articulosList.scrollTop = 0;
          } else {
            console.log('No se encontró elemento para scroll en modal');
          }
        }
      }
    }, 150);
  }

  // Métodos de paginación para el modal
  articulosNextPage() {
    if (this.articulosPagination && this.articulosPagination.hasNextPage) {
      this.loadArticulos(this.articulosCurrentPage + 1, this.searchArticuloTxt);
    }
  }

  articulosPrevPage() {
    if (this.articulosPagination && this.articulosPagination.hasPrevPage) {
      this.loadArticulos(this.articulosCurrentPage - 1, this.searchArticuloTxt);
    }
  }

  articulosGoToPage(page: number) {
    if (page >= 1 && this.articulosPagination && page <= this.articulosPagination.totalPages) {
      this.loadArticulos(page, this.searchArticuloTxt);
    }
  }
}
