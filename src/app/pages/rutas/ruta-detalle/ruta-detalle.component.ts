import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { RutasService } from 'src/app/services/rutas.service';

@Component({
  selector: 'app-ruta-detalle',
  standalone: false,
  templateUrl: './ruta-detalle.component.html',
  styleUrls: ['./ruta-detalle.component.scss']
})
export class RutaDetalleComponent implements OnInit {

  rutaId: string | null = null;
  ruta: any;
  tabSelected = 'detalles'; // 'detalles','materiales','partes','facturacion'
  materiales: any[] = [];
  partesAsignados: any[] = [];
  facturaciones: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private _rutas : RutasService
  ) {}

  ngOnInit() {
    this.rutaId = this.route.snapshot.paramMap.get('id');
    if (this.rutaId) {
      this.cargarRuta(this.rutaId);
    }
  }

  async cargarRuta(id: string) {
    try {
      // getRutaById devuelve directamente el RouteResponse
      const ruta = await this._rutas.getRutaById(id).toPromise();
      if (ruta) {
        this.ruta = ruta;
        // Los materiales vienen en herramientas
        this.materiales = ruta.herramientas || [];
        // Cargar partes asignados a esta ruta
        await this.cargarPartes(id);
        // Las facturaciones se cargarían desde otro servicio si existe
        this.facturaciones = [];
      }
    } catch (error) {
      console.error('Error al cargar ruta:', error);
    }
  }

  async cargarPartes(rutaId: string) {
    try {
      const response = await this._rutas.getPartesDeRuta(rutaId).toPromise();
      if (response && response.ok && response.data?.partes) {
        this.partesAsignados = response.data.partes;
      }
    } catch (error) {
      console.error('Error al cargar partes:', error);
      this.partesAsignados = [];
    }
  }

  seleccionarTab(tab: any) {
    this.tabSelected = tab;
  }

  agregarMaterial() {
    // Mostrar modal de materiales disponibles
  }

  agregarParte() {
    // Mostrar modal de partes no asignados
  }

  goBack() {
    this.navCtrl.back();
  }
}
