import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { PartesService } from 'src/app/services/partes.service';
import { RutasService } from 'src/app/services/rutas.service';
import { CustomerService } from 'src/app/services/customer.service';
import { ArticuloService } from 'src/app/services/articulo.service';
import { Articulo } from 'src/app/models/articulo.model';

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

  customers: any[] = []; // lista de clientes
  minDate: string = '';  // p.ej. '2023-08-01'

  clientModalOpen = false;
  filteredCustomers: any[] = [];
  searchClientTxt: string = '';
  
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
    private _articulos: ArticuloService
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
        // Si no estamos editando, cargar rutas del mes actual
        this.loadRutas();
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

  async loadCustomers() {
    const req = await this._customer.getCustomers();
    req.subscribe((resp: any) => {
      if (resp.ok && resp.data && resp.data.customers) {
        this.customersList = resp.data.customers;
        this.filteredCustomers = [...this.customersList];
      }
    });
  }

  async loadRutas() {
    // Generamos la fecha "YYYY-MM-01" para el mes actual
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const firstDayOfMonth = `${year}-${month}-01`;

    // Llamamos a getRutasDisponibles(firstDayOfMonth)
    const rReq = await this._rutas.getRutasDisponibles(firstDayOfMonth);
    rReq.subscribe((res: any) => {
      if (res.ok && res.rutas) {
        this.rutasDisponibles = res.rutas;
        console.log('Rutas cargadas:', this.rutasDisponibles);
      }
    });
  }

  async loadRutasByDate(selectedDate: string) {
    // Convertir la fecha seleccionada al primer día del mes
    const dateObj = new Date(selectedDate);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const firstDayOfMonth = `${year}-${month}-01`;

    // Limpiar las rutas anteriores para evitar duplicados
    this.rutasDisponibles = [];

    // Cargar rutas del mes seleccionado
    try {
      const rReq = this._rutas.getRutasDisponibles(firstDayOfMonth);
      rReq.subscribe((res: any) => {
        if (res.ok && res.rutas) {
          this.rutasDisponibles = res.rutas;
          console.log('Rutas cargadas para el mes seleccionado:', this.rutasDisponibles);

          // También cargar rutas del mes actual si es diferente
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
          const firstDayCurrentMonth = `${currentYear}-${currentMonth}-01`;

          // Solo cargar si es diferente al mes seleccionado
          if (firstDayCurrentMonth !== firstDayOfMonth) {
            const req2 = this._rutas.getRutasDisponibles(firstDayCurrentMonth);
            req2.subscribe((res2: any) => {
              if (res2.ok && res2.rutas) {
                // Agregar rutas que no estén ya en la lista
                res2.rutas.forEach((ruta: any) => {
                  if (!this.rutasDisponibles.find(r => r._id === ruta._id)) {
                    this.rutasDisponibles.push(ruta);
                  }
                });
                console.log('Rutas disponibles totales:', this.rutasDisponibles);
              }
            });
          }
        }
      });
    } catch (error) {
      console.error('Error al cargar rutas:', error);
    }
  }

  async loadParte(id: string) {
    this.isLoadingParte = true; // Activar flag para evitar disparo del listener
    
    const req = await this._parte.getParteById(id);
    req.subscribe((res: any) => {
      if (!res) return;

      const p = res;                         // alias corto
      const fechaIso = p.date ? this.isoDateOnly(p.date) : '';

      console.log('Parte cargado:', p);
      console.log('Ruta del parte:', p.ruta);

      /* ----------- rellenar FormGroup ----------- */
      this.parteForm.patchValue({
        title: p.title ?? '',
        description: p.description,
        address: p.address ?? '',
        facturacion: p.facturacion,
        state: p.state,
        type: p.type,
        categoria: p.categoria,
        date: fechaIso,
        customer: p.customer?._id ?? '',
        ruta: p.ruta?._id ?? p.ruta ?? '',
        coordinationMethod: p.coordinationMethod,
        gestiona: p.gestiona,
        periodico: p.periodico,
        frequency: p.frequency ?? 'Mensual',
        endDate: p.endDate ? this.isoDateOnly(p.endDate) : ''
      });

      /* mostrar el nombre del cliente en el input de búsqueda */
      this.searchClientTxt = p.customer?.name ?? '';

      // Cargar rutas del mes del parte y también del mes actual
      this.loadRutasForParte(p.date, p.ruta);

      /* ----------- cargar artículos si existen ----------- */
      if (p.articulos?.length) {
        /* vaciamos el array por si ya hay items */
        while (this.articulosFormArray.length) this.articulosFormArray.removeAt(0);

        p.articulos.forEach((a: any) => {
          const g = this.crearArticuloFormGroup();
          g.patchValue({
            cantidad: a.cantidad,
            codigo: a.codigo,
            grupo: a.grupo,
            familia: a.familia,
            descripcionArticulo: a.descripcionArticulo,
            precioVenta: a.precioVenta,
            articuloId: a.articuloId || ''
          });
          this.articulosFormArray.push(g);
        });
      }
      
      this.isLoadingParte = false; // Desactivar flag después de cargar
    });
  }

  async loadRutasForParte(parteDate: string, rutaAsignada: any) {
    // Cargar rutas del mes del parte
    const parteDateObj = new Date(parteDate);
    const year = parteDateObj.getFullYear();
    const month = String(parteDateObj.getMonth() + 1).padStart(2, '0');
    const firstDayOfMonth = `${year}-${month}-01`;

    // Cargar rutas del mes del parte
    const req = await this._rutas.getRutasDisponibles(firstDayOfMonth);
    req.subscribe((res: any) => {
      if (res.ok && res.rutas) {
        this.rutasDisponibles = [...res.rutas];
        console.log('Rutas cargadas para el mes del parte:', this.rutasDisponibles);

        // Si hay una ruta asignada, asegurarse de que esté en la lista
        if (rutaAsignada) {
          const rutaId = rutaAsignada._id || rutaAsignada;
          const rutaExists = this.rutasDisponibles.find(r => r._id === rutaId);
          if (!rutaExists && rutaAsignada._id) {
            // Si la ruta no está en la lista, agregarla
            this.rutasDisponibles.push(rutaAsignada);
          }
        }
      }
    });

    // También cargar rutas del mes actual
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const firstDayCurrentMonth = `${currentYear}-${currentMonth}-01`;

    // Solo cargar si es diferente al mes del parte
    if (firstDayCurrentMonth !== firstDayOfMonth) {
      const req2 = await this._rutas.getRutasDisponibles(firstDayCurrentMonth);
      req2.subscribe((res: any) => {
        if (res.ok && res.rutas) {
          // Agregar rutas que no estén ya en la lista
          res.rutas.forEach((ruta: any) => {
            if (!this.rutasDisponibles.find(r => r._id === ruta._id)) {
              this.rutasDisponibles.push(ruta);
            }
          });
          console.log('Rutas disponibles totales:', this.rutasDisponibles);
        }
      });
    }
  }

  async onSave() {
    if (this.parteForm.invalid) return;

    const data = this.parteForm.value;




    // Verificar en front date >= minDate
    if (new Date(data.date) < new Date(this.minDate)) {
      console.error('Fecha anterior al mes actual');
      return;
    }

    if (!this.isEdit) {
      const body = { ...this.parteForm.value };
      if (!body.ruta || body.ruta === '') delete body.ruta;
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
        if (resp.ok) {
          this.navCtrl.navigateRoot('/partes');
        } else {
          console.error('Error al crear parte:', resp.error, resp.detalles);
        }
      }, (error) => {
        console.error('Error en la petición:', error);
      });
    } else {
      // Actualizar parte
      const body = { ...this.parteForm.value, _id: this.parteId };
      if (!body.ruta || body.ruta === '') delete body.ruta;
      if (!body.endDate || body.endDate === '') delete body.endDate;
      if (!body.frequency || body.frequency === '') delete body.frequency;
      
      // Limpiar articuloId de cada artículo antes de enviar
      if (body.articulos && Array.isArray(body.articulos)) {
        body.articulos = body.articulos.map((articulo: any) => {
          const { articuloId, ...articuloClean } = articulo;
          return articuloClean;
        });
      }
      
      const req = await this._parte.updateParte(body);
      req.subscribe((resp: any) => {
        if (resp.ok) {
          this.navCtrl.navigateRoot('/partes');
        }
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
    this.clientModalOpen = true;
  }
  closeClientModal() {
    this.clientModalOpen = false;
  }

  filterCustomers(event: any) {
    const txt = this.searchClientTxt.toLowerCase().trim();
    this.filteredCustomers = this.customersList.filter(c =>
      c.name.toLowerCase().includes(txt) ||
      c.nifCif.toLowerCase().includes(txt)
    );
  }

  selectCustomer(c: any) {
    // Asignamos al form
    this.parteForm.patchValue({ customer: c._id });
    this.searchClientTxt = c.name; // para mostrarlo en el IonInput
    this.clientModalOpen = false;
  }

  cancel() {
    this.navCtrl.back();
  }

  private isoDateOnly(dateStr: string): string {
    return new Date(dateStr).toISOString().substring(0, 10);
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
