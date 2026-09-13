import { Patient, Surgery, DoctorProfile } from '../types';

export const initialDoctorProfile: DoctorProfile = {
  nombre: 'Dr. Martín Morales',
  especialidad: 'Cirugía General y Laparoscopía de Avanzada',
  matricula: 'M.N. 148.920 / M.P. 45.210',
  clinicaHabitual: 'Sanatorio Trinidad / Quirófano Central',
  monedaLocalNombre: 'Pesos (Local)',
  monedaLocalSimbolo: '$',
  telefonoContacto: '+54 9 11 4455-8899',
  emailContacto: 'dr.morales.cirugia@med.com',
  biometriaHabilitada: true,
  pinSeguridad: '1234',
};

export const initialPatients: Patient[] = [
  {
    id: 'pat-1',
    dni: '38.452.190',
    nombreCompleto: 'Valentina Rossi',
    telefono: '+54 9 11 5521-4321',
    email: 'v.rossi@gmail.com',
    edad: 34,
    obraSocial: 'OSDE 310',
    numeroAfiliado: '8294719001',
    antecedentesMedicos: 'Apendicectomía a los 14 años. Sin antecedentes cardiovasculares.',
    alergias: 'Penicilina y derivados',
    medicacionHabitual: 'Levotiroxina 50mcg/día',
    historiaClinicaResumen: 'Paciente que consulta por cuadro de cólicos biliares a repetición asociados a ingesta colecistoquinética. Ecografía confirma litiasis vesicular múltiple sin signos de colecistitis aguda.',
    fotosEstudios: [
      {
        id: 'est-1',
        url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
        titulo: 'Ecografía Abdominal Biliar',
        categoria: 'estudio',
        fecha: '2026-08-15',
      },
      {
        id: 'est-2',
        url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=80',
        titulo: 'Laboratorio Pre-quirúrgico Completo',
        categoria: 'estudio',
        fecha: '2026-08-18',
      }
    ],
    fechaCreacion: '2026-08-10',
  },
  {
    id: 'pat-2',
    dni: '29.112.554',
    nombreCompleto: 'Gonzalo Benítez',
    telefono: '+54 9 11 6398-1122',
    email: 'gbenitez@outlook.com',
    edad: 48,
    obraSocial: 'Swiss Medical SMG20',
    numeroAfiliado: '1928445102',
    antecedentesMedicos: 'Hipertensión arterial controlada.',
    alergias: 'Sin alergias medicamentosas conocidas',
    medicacionHabitual: 'Enalapril 10mg',
    historiaClinicaResumen: 'Hernia inguinal derecha reductible y sintomática de 6 meses de evolución con dolor al esfuerzo físico y maniobra de Valsalva positiva.',
    fotosEstudios: [
      {
        id: 'est-3',
        url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=600&auto=format&fit=crop&q=80',
        titulo: 'Ecografía de Partes Blandas Inguinal',
        categoria: 'estudio',
        fecha: '2026-08-20',
      }
    ],
    fechaCreacion: '2026-08-12',
  },
  {
    id: 'pat-3',
    dni: '42.901.833',
    nombreCompleto: 'Camila Méndez',
    telefono: '+54 9 11 3302-8819',
    email: 'camilamendez.art@gmail.com',
    edad: 27,
    obraSocial: 'Particular (Privado)',
    numeroAfiliado: 'N/A',
    antecedentesMedicos: 'Negativos de relevancia.',
    alergias: 'Ninguna',
    medicacionHabitual: 'Ninguna',
    historiaClinicaResumen: 'Dolor en fosa ilíaca derecha con Blumberg (+) y leucocitosis. Cuadro compatible con apendicitis aguda grado II.',
    fotosEstudios: [],
    fechaCreacion: '2026-08-28',
  },
  {
    id: 'pat-4',
    dni: '33.204.991',
    nombreCompleto: 'Roberto D. Alvarez',
    telefono: '+54 9 11 4411-9988',
    email: 'roberto.alvarez@empresa.com',
    edad: 42,
    obraSocial: 'Galeno Oro',
    numeroAfiliado: '4491028300',
    antecedentesMedicos: 'Tabaquista leve. Hernia hiatal con reflujo.',
    alergias: 'Ibuprofeno (gastralgia)',
    medicacionHabitual: 'Omeprazol 20mg',
    historiaClinicaResumen: 'Eventración mediana infraumbilical post laparotomía previa. Se programa hernioplastía con malla de polipropileno tridimensional.',
    fotosEstudios: [],
    fechaCreacion: '2026-09-01',
  }
];

export const initialSurgeries: Surgery[] = [
  {
    id: 'surg-1',
    pacienteId: 'pat-1',
    pacienteNombre: 'Valentina Rossi',
    pacienteDni: '38.452.190',
    tipoCirugia: 'Colecistectomía Laparoscópica',
    fechaCirugia: '2026-09-02T08:30:00.000Z',
    lugar: 'Sanatorio Trinidad - Quirófano 4',
    estado: 'Realizada',
    equipoMedico: {
      ayudante: 'Dr. Lucas Ferreyra',
      anestesista: 'Dra. Silvina Romero',
      instrumentadora: 'Lic. Mariana Gómez',
    },
    protocoloQuirurgico: `Bajo anestesia general balanceada e intubación orotraqueal, en posición decúbito dorsal francesa con Trendelenburg reverso y lateralización izquierda.
Asepsia y antisepsia de campo con clorhexidina al 2%.
Neumoperitoneo mediante técnica abierta en ombligo (Hasson) a 12 mmHg.
Colocación de 4 trocares (1 de 10mm umbilical, 1 de 10mm subxifoideo, 2 de 5mm en flanco derecho).
Hallazgos: Vesícula biliar de paredes delgadas, cálculos facetados en bacinete de 8mm, sin colecistitis escleroatrófica ni adherencias al duodeno.
Técnica: Disección meticulosa del trígono de Calot. Visión crítica de seguridad de Strasberg completa (2 estructuras ingresando a la vesícula y tercio inferior del lecho despegado).
Clipado triple del conducto cístico (2 proximales, 1 distal) y sección con tijera.
Clipado doble de arteria cística y sección.
Colecistectomía retrógrada con electrobisturí monopolar tipo hook.
Hemostasia y bilistasis del lecho vesicular prolija.
Extracción en bolsa extractora por orificio umbilical.
Cierre aponeurótico con Vicryl 0 y síntesis de piel con Monocryl 4-0 intradérmico.
Tolerancia adecuada sin incidentes ni sangrado significativo.`,
    fotosPostOp: [
      {
        id: 'pic-1',
        url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=600&auto=format&fit=crop&q=80',
        titulo: 'Visión Crítica de Seguridad (Calot)',
        categoria: 'intraoperatorio',
        fecha: '2026-09-02',
      },
      {
        id: 'pic-2',
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
        titulo: 'Pieza quirúrgica extraída',
        categoria: 'biopsia',
        fecha: '2026-09-02',
      }
    ],
    diasControlAlerta: 7,
    fechaControlAlerta: '2026-09-09',
    finanzas: {
      moneda: 'USD',
      montoBruto: 1200,
      pagoEquipo: 300,
      gananciaNeta: 900,
      metodoPago: 'Obra Social',
      entidadPago: 'OSDE 310',
      estadoPago: 'Pendiente',
      estadoPagoEquipo: 'Pendiente',
      notasFinancieras: 'Factura presentada en auditoría de OSDE el 03/09. Estimado de liquidación: 30 días.',
    },
    creadoEl: '2026-09-02T11:45:00.000Z',
  },
  {
    id: 'surg-2',
    pacienteId: 'pat-2',
    pacienteNombre: 'Gonzalo Benítez',
    pacienteDni: '29.112.554',
    tipoCirugia: 'Hernioplastía Inguinal Lichtenstein',
    fechaCirugia: '2026-08-25T10:00:00.000Z',
    lugar: 'Sanatorio Trinidad - Quirófano 2',
    estado: 'Post-Op',
    equipoMedico: {
      ayudante: 'Dr. Lucas Ferreyra',
      anestesista: 'Dr. Damián Castro',
      instrumentadora: 'Lic. Mariana Gómez',
    },
    protocoloQuirurgico: `Anestesia raquídea con bupivacaína pesada. Paciente en decúbito dorsal.
Incisión transversa oblicua en fosa ilíaca derecha de 6 cm sobre el trayecto inguinal.
Apertura de la aponeurosis del oblicuo mayor respetando el nervio ilioinguinal y genital del genitofemoral.
Disección y aislamiento del cordón espermático con cinta hilera.
Hallazgo: Hernia inguinal indirecta con saco con contenido epiploico reductible sin compromiso isquémico.
Disección del saco herniario hasta el cuello y reducción completa al espacio preperitoneal.
Reconstrucción de la pared posterior con técnica libre de tensión tipo Lichtenstein: fijación de malla de polipropileno de 7,5 x 15 cm al tubérculo del pubis con prolene 2-0 y borde inferior a la arcada crural.
Confección de hendidura en malla para el paso del cordón espermático.
Cierre aponeurótico y síntesis de tejido celular y piel con sutura intradérmica reabsorbible.`,
    fotosPostOp: [],
    diasControlAlerta: 15,
    fechaControlAlerta: '2026-09-09',
    finanzas: {
      moneda: 'LOCAL',
      montoBruto: 1850000,
      pagoEquipo: 450000,
      gananciaNeta: 1400000,
      metodoPago: 'Obra Social',
      entidadPago: 'Swiss Medical',
      estadoPago: 'Cobrado',
      fechaCobroReal: '2026-09-05',
      estadoPagoEquipo: 'Pagado',
      fechaPagoEquipo: '2026-09-06',
      notasFinancieras: 'Cobro acreditado por transferencia interbancaria. Pago a ayudante transferido el 06/09.',
    },
    creadoEl: '2026-08-25T13:00:00.000Z',
  },
  {
    id: 'surg-3',
    pacienteId: 'pat-3',
    pacienteNombre: 'Camila Méndez',
    pacienteDni: '42.901.833',
    tipoCirugia: 'Apendicectomía Laparoscópica de Urgencia',
    fechaCirugia: '2026-08-29T22:15:00.000Z',
    lugar: 'Sanatorio Trinidad - Guardia Quirúrgica',
    estado: 'Post-Op',
    equipoMedico: {
      ayudante: 'Dra. Andrea Beltrán',
      anestesista: 'Dr. Damián Castro',
      instrumentadora: 'Enf. Patricia Soto',
    },
    protocoloQuirurgico: `Urgencia médica. Anestesia general orotraqueal.
Tríada de trocares laparoscópicos habituales.
Hallazgos: Apéndice cecal congestivo, engrosado, con falso exudado fibrinoso (Apendicitis Aguda Flemonosa grado II).
Líquido seroso en fondo de saco de Douglas sin pus franco.
Técnica: Esqueletización mesoapendicular con bipolar / bisturí armónico.
Doble ligadura de base apendicular con lazo Endoloop de poliglactina 0. Sección entre ligaduras.
Aspiración de líquido peritoneal y lavado prolijo con solución fisiológica tibia.
Extracción protegida en endobag. Cierre de incisiones.
Evolución inmediata favorable en sala de recuperación anestésica.`,
    fotosPostOp: [],
    diasControlAlerta: 7,
    fechaControlAlerta: '2026-09-05',
    finanzas: {
      moneda: 'USD',
      montoBruto: 950,
      pagoEquipo: 200,
      gananciaNeta: 750,
      metodoPago: 'Particular',
      entidadPago: 'Particular Efectivo/Transferencia',
      estadoPago: 'Cobrado',
      fechaCobroReal: '2026-08-30',
      estadoPagoEquipo: 'Pagado',
      fechaPagoEquipo: '2026-08-30',
      notasFinancieras: 'Abonado en efectivo al alta por familiar.',
    },
    creadoEl: '2026-08-30T01:30:00.000Z',
  },
  {
    id: 'surg-4',
    pacienteId: 'pat-4',
    pacienteNombre: 'Roberto D. Alvarez',
    pacienteDni: '33.204.991',
    tipoCirugia: 'Eventroplastía Abdominal con Malla 3D',
    fechaCirugia: '2026-09-12T07:30:00.000Z',
    lugar: 'Sanatorio Trinidad - Quirófano 1',
    estado: 'Programada',
    equipoMedico: {
      ayudante: 'Dr. Lucas Ferreyra',
      anestesista: 'Dra. Silvina Romero',
      instrumentadora: 'Lic. Mariana Gómez',
    },
    protocoloQuirurgico: 'Cirugía programada. Paciente citado con ayuno de 8hs y baño jabonoso antiséptico. Prótesis y material quirúrgico ya entregado y esterilizado en farmacia central.',
    fotosPostOp: [],
    diasControlAlerta: 10,
    finanzas: {
      moneda: 'LOCAL',
      montoBruto: 2200000,
      pagoEquipo: 550000,
      gananciaNeta: 1650000,
      metodoPago: 'Obra Social',
      entidadPago: 'Galeno Oro',
      estadoPago: 'Pendiente',
      estadoPagoEquipo: 'Pendiente',
      notasFinancieras: 'Autorización Nro. #GA-981273 aprobada. Pendiente realización y posterior liquidación.',
    },
    creadoEl: '2026-09-05T09:00:00.000Z',
  }
];
