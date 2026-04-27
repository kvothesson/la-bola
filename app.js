const app = document.getElementById('app');

// ─── TRACKING ────────────────────────────────────────────────────────────────

const SUPA_URL = 'https://pcdeycvvhleigsxzloqd.supabase.co';
const SUPA_KEY = 'sb_publishable_Nx-X2sKGB3KXuvGQvsMdlw_VruQ27vW';
const IS_DEV = localStorage.getItem('labola_dev') === '1';

function track(action, metadata) {
  fetch(`${SUPA_URL}/rest/v1/labola_events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPA_KEY,
      'Authorization': `Bearer ${SUPA_KEY}`
    },
    body: JSON.stringify({ action, metadata: metadata || null, dev: IS_DEV })
  }).catch(() => {});
}

// ─── STORAGE ─────────────────────────────────────────────────────────────────

function cargar() {
  try { return JSON.parse(localStorage.getItem('labola')) || {}; }
  catch { return {}; }
}
function guardar(data) { localStorage.setItem('labola', JSON.stringify(data)); }

function formatPesos(n) {
  return '$' + Math.round(n).toLocaleString('es-AR');
}

// ─── ÁRBOL DE DECISIÓN ───────────────────────────────────────────────────────

const ARBOL = {

  inicio: {
    pregunta: '¿En qué situación estás?',
    tipo: 'opciones',
    opciones: [
      { texto: 'Tengo deudas y quiero organizarme',        siguiente: 'organizar_cuantas' },
      { texto: 'Este mes no me alcanza para pagar nada',   siguiente: 'crisis_motivo' },
      { texto: 'Solo pago el mínimo y la deuda no baja',   siguiente: 'minimo_info' },
      { texto: 'La deuda está a mi nombre pero la debe otro', siguiente: 'tercero_reclamo' },
    ]
  },

  // ── RAMA A: Organizar ────────────────────────────────────────────────────

  organizar_cuantas: {
    pregunta: '¿A cuántos lugares le debés?',
    tipo: 'opciones',
    opciones: [
      { texto: 'A uno solo',   siguiente: 'organizar_una_deuda' },
      { texto: 'A varios',     siguiente: 'organizar_urgente' },
    ]
  },

  organizar_urgente: {
    pregunta: '¿Hay alguna deuda que si no pagás esta semana te genera un problema inmediato?\n(te cortan un servicio, te embargan, te llaman de un estudio jurídico)',
    tipo: 'opciones',
    opciones: [
      { texto: 'Sí, hay una así', siguiente: 'organizar_primero_urgente' },
      { texto: 'No, todas pueden esperar un mes', siguiente: 'organizar_plan' },
    ]
  },

  organizar_primero_urgente: {
    tipo: 'resultado',
    titulo: 'Primero lo urgente',
    pasos: [
      'Identificá exactamente cuál es esa deuda urgente y cuánto hay que pagar para evitar el problema.',
      'Ese es tu único objetivo esta semana. El resto espera.',
      'Una vez que eso esté resuelto, volvé acá para organizar el resto.',
      'Si no tenés el dinero para esa deuda urgente → usá la opción "este mes no me alcanza para pagar nada".',
    ],
    botonReinicio: true
  },

  organizar_una_deuda: {
    tipo: 'resultado',
    titulo: 'Con una sola deuda es más simple',
    pasos: [
      'Anotá el monto exacto que debés hoy (mirá el resumen o la app de la entidad).',
      'Fijate cuánto podés pagar por mes sin quedarte sin plata para vivir.',
      'Pagá siempre más que el mínimo. Aunque sea $500 más. El mínimo solo paga intereses.',
      'Si podés, llamá a la entidad y preguntá si tienen un plan de refinanciación en cuotas fijas. Muchas veces dicen que sí.',
    ],
    botonReinicio: true
  },

  organizar_plan: {
    tipo: 'plan_deudas',
  },

  // ── RAMA B: Crisis, no puedo pagar nada ─────────────────────────────────

  crisis_motivo: {
    pregunta: '¿Por qué no te alcanza este mes?',
    tipo: 'opciones',
    opciones: [
      { texto: 'Me quedé sin trabajo o me bajaron el sueldo', siguiente: 'crisis_sin_trabajo' },
      { texto: 'Tuve un gasto inesperado (salud, familia)',   siguiente: 'crisis_gasto_imprevisto' },
      { texto: 'Gasto más de lo que me entra',               siguiente: 'crisis_gasto_habitual' },
      { texto: 'Otro motivo',                                 siguiente: 'crisis_generica' },
    ]
  },

  crisis_sin_trabajo: {
    tipo: 'resultado',
    titulo: 'Sin trabajo o con menos ingresos',
    pasos: [
      'Llamá a cada entidad que te debe y explicá la situación. Pedí una "refinanciación" o "período de gracia". Muchas tienen protocolos para esto.',
      'Qué decir exactamente: "Perdí mi fuente de ingresos. No voy a poder pagar este mes. ¿Qué opciones tienen para refinanciar o pausar la deuda?"',
      'Si tenés tarjeta de crédito: no la uses para pagar otras deudas. Es la trampa más común.',
      'En Argentina podés consultar ANSES si aplican planes de asistencia según tu situación.',
      'Prioridad inmediata: alquiler/hipoteca > servicios básicos (luz, gas, agua) > comida. Las deudas financieras pueden esperar más que esas.',
    ],
    botonReinicio: true
  },

  crisis_gasto_imprevisto: {
    tipo: 'resultado',
    titulo: 'Gasto inesperado que te desbalanceó',
    pasos: [
      'Es una situación temporal. El objetivo es no agravar la deuda existente mientras resolvés.',
      'Llamá a las entidades que debés y pedí "una prórroga de 30 días". No tenés que dar muchas explicaciones, solo pedirla.',
      'Si tenés tarjeta: pagá el mínimo este mes. No es lo ideal, pero evita que te caiga en mora.',
      'Una vez que pase el gasto imprevisto, volvé acá para armar un plan de salida.',
    ],
    botonReinicio: true
  },

  crisis_gasto_habitual: {
    tipo: 'resultado',
    titulo: 'Gastás más de lo que entra',
    pasos: [
      'El primer paso es ver los números: ¿cuánto entra por mes y cuánto sale? Anotalo, aunque duela.',
      'Buscá UN gasto que puedas eliminar esta semana. Solo uno. No hace falta cambiar todo de golpe.',
      'Las compras "para no estar triste" son reales — no son caprichos. Pero a largo plazo te generan más angustia que la que alivian. Hablar con alguien ayuda más que comprar.',
      'Si tenés tarjeta de crédito: bloqueala temporalmente desde la app del banco. No la canceles, solo bloqueala.',
      'Si podés, buscá una segunda fuente de ingresos aunque sea chica. Un trabajo extra de 2-3 horas cambia mucho.',
    ],
    botonReinicio: true
  },

  crisis_generica: {
    tipo: 'resultado',
    titulo: 'Cuando no podés pagar nada',
    pasos: [
      'Llamá a cada entidad y avisá antes de que te caigan en mora. Siempre es mejor que desaparecer.',
      'Pedí una "refinanciación" o "acuerdo de pago". Tienen incentivo para darte una salida.',
      'Priorizá: servicios básicos y alquiler antes que deudas financieras.',
      'No saques nuevos créditos para pagar otros. Agrava la situación.',
      'Volvé cuando tengas algo de margen y armamos un plan.',
    ],
    botonReinicio: true
  },

  // ── RAMA C: Pago el mínimo ───────────────────────────────────────────────

  minimo_info: {
    tipo: 'calculadora_minimo',
  },

  // ── RAMA D: Deuda de otro a mi nombre ───────────────────────────────────

  tercero_reclamo: {
    pregunta: '¿Ya le reclamaste a esa persona?',
    tipo: 'opciones',
    opciones: [
      { texto: 'Sí, pero no paga o no puede', siguiente: 'tercero_no_paga' },
      { texto: 'No, todavía no le dije nada', siguiente: 'tercero_hablar' },
    ]
  },

  tercero_hablar: {
    tipo: 'resultado',
    titulo: 'Primero, la conversación',
    pasos: [
      'Hablalo directamente, aunque sea incómodo. No lo postergues más.',
      'Qué decir: "La deuda está a mi nombre. Si no se paga me afecta a mí en el historial crediticio y en mi capacidad de sacar créditos. Necesito que me digas cuándo y cómo la vas a pagar."',
      'Pedile que te pase algo por escrito: un mensaje de WhatsApp ya sirve como registro.',
      'Pongan una fecha concreta. No "cuando pueda" — una fecha.',
      'Si no reacciona, volvé acá para ver los pasos siguientes.',
    ],
    botonReinicio: true
  },

  tercero_no_paga: {
    pregunta: '¿Es un familiar o un conocido/amigo?',
    tipo: 'opciones',
    opciones: [
      { texto: 'Es un familiar',   siguiente: 'tercero_familiar' },
      { texto: 'Es un conocido',   siguiente: 'tercero_conocido' },
    ]
  },

  tercero_familiar: {
    tipo: 'resultado',
    titulo: 'Deuda de un familiar a tu nombre',
    pasos: [
      'Antes que nada: no rompas el vínculo por esto si podés evitarlo. Pero tampoco podés hacerte cargo indefinidamente.',
      'Calculá cuánto te está costando realmente: el monto + los intereses que corrés por vos.',
      'Planteale que cancele la extensión o que te pase la deuda a su nombre si puede. Si no puede, necesitás un plan de cuotas claro entre vos.',
      'Documentá todo: montos, fechas, acuerdos. Un mensaje escrito alcanza.',
      'Si la deuda ya está generando intereses que no podés cubrir, llamá a la entidad y pedí congelar la deuda mientras resolvés la situación.',
    ],
    botonReinicio: true
  },

  tercero_conocido: {
    tipo: 'resultado',
    titulo: 'Deuda de un conocido a tu nombre',
    pasos: [
      'Si ya le reclamaste y no paga, el vínculo ya está dañado. Tu prioridad ahora es protegerte vos.',
      'Guardá todos los registros: mensajes, transferencias, cualquier prueba del acuerdo original.',
      'Podés hacer una carta documento (cuesta alrededor de $5.000) reclamando formalmente la deuda. Eso muchas veces reactiva el pago.',
      'Si el monto es alto, consultá con un abogado. Muchos ofrecen primera consulta gratuita.',
      'Mientras tanto, llamá a la entidad y avisá la situación. Pedí un plan de pago para evitar que crezca más.',
    ],
    botonReinicio: true
  },

};

// ─── MOTOR DE NAVEGACIÓN ─────────────────────────────────────────────────────

let historial = [];

function ir(nodoId) {
  historial.push(nodoId);
  track('nodo', { nodo: nodoId, desde: historial[historial.length - 2] || null });
  renderNodo(nodoId);
}

function volver() {
  if (historial.length <= 1) return;
  historial.pop();
  renderNodo(historial[historial.length - 1]);
}

function reiniciar() {
  historial = [];
  renderNodo('inicio');
}

// ─── RENDER PRINCIPAL ────────────────────────────────────────────────────────

function renderNodo(nodoId) {
  const nodo = ARBOL[nodoId];
  if (!nodo) return;

  const puedVolver = historial.length > 1;

  if (nodo.tipo === 'opciones') {
    renderOpciones(nodo, puedVolver);
  } else if (nodo.tipo === 'resultado') {
    renderResultado(nodo, puedVolver);
  } else if (nodo.tipo === 'plan_deudas') {
    renderPlanDeudas(puedVolver);
  } else if (nodo.tipo === 'calculadora_minimo') {
    renderCalculadoraMinimo(puedVolver);
  }
}

// ─── PANTALLAS ───────────────────────────────────────────────────────────────

function renderOpciones(nodo, puedVolver) {
  app.innerHTML = `
    ${puedVolver ? `<button class="btn-volver" onclick="volver()">← Volver</button>` : ''}
    <div class="header">
      <h1>La Bola</h1>
    </div>
    <div class="pregunta">${nodo.pregunta.replace(/\n/g, '<br>')}</div>
    <div class="opciones">
      ${nodo.opciones.map(op => `
        <button class="btn-opcion" onclick="ir('${op.siguiente}')">${op.texto}</button>
      `).join('')}
    </div>
  `;
}

function renderResultado(nodo, puedVolver) {
  const esCrisis = nodo.titulo?.toLowerCase().includes('crisis') ||
    nodo.titulo?.toLowerCase().includes('no podés') ||
    nodo.titulo?.toLowerCase().includes('sin trabajo') ||
    nodo.titulo?.toLowerCase().includes('inesperado') ||
    nodo.titulo?.toLowerCase().includes('alcanza') ||
    nodo.titulo?.toLowerCase().includes('gastás');

  app.innerHTML = `
    ${puedVolver ? `<button class="btn-volver" onclick="volver()">← Volver</button>` : ''}
    <div class="header">
      <h1>${nodo.titulo}</h1>
    </div>
    <div class="pasos">
      ${nodo.pasos.map((paso, i) => `
        <div class="paso">
          <div class="paso-num">${i + 1}</div>
          <div class="paso-texto">${paso}</div>
        </div>
      `).join('')}
    </div>
    ${esCrisis ? `
      <div class="aviso-crisis">
        Esto es orientación general. Si la situación es muy compleja, un asesor financiero o ANSES pueden ayudar más que cualquier app.
      </div>
    ` : ''}
    <div class="no-es-tuya">
      ¿Esta situación no es exactamente la tuya?
      <button class="btn-link" onclick="reiniciar()">Volvé al inicio</button>
    </div>
    <button class="btn btn-secundario mt-8" onclick="reiniciar()">Empezar de nuevo</button>
  `;
}

function renderPlanDeudas(puedVolver) {
  const estado = cargar();
  const deudas = estado.deudas || [];
  const total = deudas.reduce((s, d) => s + d.monto, 0);

  app.innerHTML = `
    ${puedVolver ? `<button class="btn-volver" onclick="volver()">← Volver</button>` : ''}
    <div class="header">
      <h1>Tus deudas</h1>
      <p>Cargá cada deuda y cuánto podés pagar por mes.</p>
    </div>

    ${deudas.map((d, i) => `
      <div class="deuda-item">
        <div class="deuda-info">
          <div class="deuda-nombre">${d.nombre}</div>
          <input class="deuda-monto-input" type="number" inputmode="numeric"
            value="${d.monto}" onchange="actualizarMonto(${i}, this.value)" />
        </div>
        <button class="deuda-eliminar" onclick="eliminarDeuda(${i})">×</button>
      </div>
    `).join('')}

    <div class="form-agregar">
      <div class="form-fila">
        <input id="inp-nombre" type="text" placeholder="Ej: Tarjeta Galicia" autocomplete="off" />
      </div>
      <div class="form-fila">
        <input id="inp-monto" type="number" placeholder="¿Cuánto debés? (en $)" inputmode="numeric" />
      </div>
      <button class="btn btn-secundario" onclick="agregarDeuda()">+ Agregar deuda</button>
    </div>

    ${deudas.length > 0 ? `
      <div class="divider"></div>
      <div class="campo-mensual">
        <label>¿Cuánto podés pagar en total este mes?</label>
        <input id="inp-mensual" type="number" inputmode="numeric"
          placeholder="Ej: 50000" value="${estado.mensual || ''}" />
      </div>
      <button class="btn btn-primario mt-8" onclick="verPlan()">Ver mi plan →</button>
    ` : ''}

    <button class="btn btn-secundario mt-16" onclick="reiniciar()">Empezar de nuevo</button>
  `;
}

function renderPlanMes(puedVolver) {
  const estado = cargar();
  const deudas = (estado.deudas || []).filter(d => d.monto > 0);
  const ordenadas = [...deudas].sort((a, b) => a.monto - b.monto);
  const primera = ordenadas[0];
  const mensual = estado.mensual || 0;
  const total = deudas.reduce((s, d) => s + d.monto, 0);
  const original = (estado.deudas || []).reduce((s, d) => s + (d.montoOriginal || d.monto), 0);
  const porcentaje = original > 0 ? Math.round(((original - total) / original) * 100) : 0;
  const pagarPrimera = Math.min(primera.monto, mensual);
  const resto = mensual - pagarPrimera;

  app.innerHTML = `
    <div class="header">
      <h1>Tu plan este mes</h1>
    </div>

    <div class="plan-box">
      <div class="plan-label">Pagá primero</div>
      <div class="plan-deuda">${primera.nombre}</div>
      <div class="plan-monto">${formatPesos(pagarPrimera)}</div>
      ${primera.monto <= mensual
        ? `<div class="plan-resto">🎉 ¡Esta deuda queda cancelada!</div>`
        : `<div class="plan-resto">Te quedan ${formatPesos(primera.monto - pagarPrimera)} después de este mes</div>`
      }
    </div>

    ${resto > 0 && ordenadas.length > 1 ? `
      <div class="plan-box">
        <div class="plan-label">Con lo que sobra (${formatPesos(resto)})</div>
        <div class="plan-deuda">${ordenadas[1].nombre}</div>
        <div class="plan-monto" style="font-size:24px">${formatPesos(resto)}</div>
      </div>
    ` : ''}

    <div class="progreso-box">
      <div class="progreso-fila">
        <span>Deuda total</span>
        <span>${formatPesos(total)}</span>
      </div>
      ${porcentaje > 0 ? `
        <div class="progreso-fila">
          <span>Pagado hasta ahora</span>
          <span>${porcentaje}%</span>
        </div>
        <div class="barra-container">
          <div class="barra-fill" style="width:${porcentaje}%"></div>
        </div>
      ` : ''}
    </div>

    <button class="btn btn-success" onclick="marcarPagado()">✓ Ya lo pagué</button>
    <div class="text-center mt-16">
      <button class="btn-link" onclick="ir('organizar_plan')">Editar mis deudas</button>
    </div>
  `;
}

function renderMesCerrado() {
  const estado = cargar();
  const deudas = (estado.deudas || []).filter(d => d.monto > 0);
  const total = deudas.reduce((s, d) => s + d.monto, 0);
  const original = (estado.deudas || []).reduce((s, d) => s + (d.montoOriginal || d.monto), 0);
  const porcentaje = original > 0 ? Math.round(((original - total) / original) * 100) : 0;

  app.innerHTML = `
    <div class="header"><h1>La Bola</h1></div>
    <div class="cerrado-box">
      <div class="cerrado-icono">✓</div>
      <div class="cerrado-titulo">Este mes está hecho.</div>
      <div class="cerrado-sub">Volvé el mes que viene para el próximo paso.</div>
    </div>
    <div class="progreso-box">
      <div class="progreso-fila">
        <span>Deuda total</span><span>${formatPesos(total)}</span>
      </div>
      ${porcentaje > 0 ? `
        <div class="progreso-fila">
          <span>Pagado hasta ahora</span><span>${porcentaje}%</span>
        </div>
        <div class="barra-container">
          <div class="barra-fill" style="width:${porcentaje}%"></div>
        </div>
      ` : ''}
    </div>
    <button class="btn btn-secundario mt-16" onclick="nuevoMes()">Empezar nuevo mes</button>
    <div class="text-center mt-16">
      <button class="btn-link" onclick="reiniciar()">Volver al inicio</button>
    </div>
  `;
}

function renderCalculadoraMinimo(puedVolver) {
  app.innerHTML = `
    ${puedVolver ? `<button class="btn-volver" onclick="volver()">← Volver</button>` : ''}
    <div class="header">
      <h1>¿Cuánto te cuesta el mínimo?</h1>
      <p>Ingresá los datos de tu deuda.</p>
    </div>

    <div class="campo-mensual">
      <label>¿Cuánto debés hoy?</label>
      <input id="calc-deuda" type="number" inputmode="numeric" placeholder="Ej: 150000" />
    </div>

    <div class="campo-mensual mt-8">
      <label>¿Cuánto es el pago mínimo por mes?</label>
      <input id="calc-minimo" type="number" inputmode="numeric" placeholder="Ej: 8000" />
    </div>

    <div class="campo-mensual mt-8">
      <label>Tasa de interés mensual (si no sabés, poné 8%)</label>
      <input id="calc-tasa" type="number" inputmode="numeric" placeholder="Ej: 8" />
    </div>

    <button class="btn btn-primario mt-8" onclick="calcularMinimo()">Ver qué me está costando</button>

    <div id="calc-resultado"></div>

    <button class="btn btn-secundario mt-24" onclick="reiniciar()">Volver al inicio</button>
  `;
}

// ─── ACCIONES ────────────────────────────────────────────────────────────────

function agregarDeuda() {
  const nombre = document.getElementById('inp-nombre')?.value?.trim();
  const monto = parseFloat(document.getElementById('inp-monto')?.value);
  if (!nombre || !monto || monto <= 0) return;
  const estado = cargar();
  if (!estado.deudas) estado.deudas = [];
  estado.deudas.push({ nombre, monto, montoOriginal: monto });
  guardar(estado);
  renderPlanDeudas(true);
}

function eliminarDeuda(i) {
  const estado = cargar();
  estado.deudas.splice(i, 1);
  guardar(estado);
  renderPlanDeudas(true);
}

function actualizarMonto(i, valor) {
  const estado = cargar();
  const nuevo = parseFloat(valor) || 0;
  estado.deudas[i].monto = nuevo;
  if (nuevo > (estado.deudas[i].montoOriginal || 0)) estado.deudas[i].montoOriginal = nuevo;
  guardar(estado);
}

function verPlan() {
  const inp = document.getElementById('inp-mensual');
  if (!inp || !inp.value) return;
  const estado = cargar();
  estado.mensual = parseFloat(inp.value) || 0;
  estado.mesCerrado = false;
  guardar(estado);
  track('plan_creado', { cant_deudas: estado.deudas.length });
  renderPlanMes(true);
}

function marcarPagado() {
  const estado = cargar();
  const ordenadas = [...(estado.deudas || [])].filter(d => d.monto > 0).sort((a, b) => a.monto - b.monto);
  let restante = estado.mensual;
  for (const deuda of ordenadas) {
    if (restante <= 0) break;
    const pago = Math.min(deuda.monto, restante);
    const idx = estado.deudas.findIndex(d => d.nombre === deuda.nombre);
    estado.deudas[idx].monto = Math.max(0, deuda.monto - pago);
    restante -= pago;
  }
  estado.mesCerrado = true;
  guardar(estado);
  track('mes_cerrado');
  renderMesCerrado();
}

function nuevoMes() {
  const estado = cargar();
  estado.mesCerrado = false;
  guardar(estado);
  renderPlanDeudas(false);
}

function calcularMinimo() {
  const deuda = parseFloat(document.getElementById('calc-deuda')?.value) || 0;
  const minimo = parseFloat(document.getElementById('calc-minimo')?.value) || 0;
  const tasa = (parseFloat(document.getElementById('calc-tasa')?.value) || 8) / 100;

  if (!deuda || !minimo) return;

  let saldo = deuda;
  let meses = 0;
  let totalPagado = 0;
  const MAX_MESES = 600;

  while (saldo > 0 && meses < MAX_MESES) {
    const interes = saldo * tasa;
    const pago = Math.max(minimo, interes + 1);
    saldo = saldo + interes - pago;
    totalPagado += pago;
    meses++;
    if (saldo < 0) { totalPagado += saldo; saldo = 0; }
  }

  const interesesTotales = totalPagado - deuda;
  const anios = Math.floor(meses / 12);
  const mesesResto = meses % 12;

  const pagarDoble = minimo * 2;
  let saldo2 = deuda;
  let meses2 = 0;
  let total2 = 0;
  while (saldo2 > 0 && meses2 < MAX_MESES) {
    const int2 = saldo2 * tasa;
    saldo2 = saldo2 + int2 - pagarDoble;
    total2 += pagarDoble;
    meses2++;
    if (saldo2 < 0) { total2 += saldo2; saldo2 = 0; }
  }
  const ahorro = totalPagado - total2;

  const tiempo = meses >= MAX_MESES
    ? 'nunca (la deuda crece más rápido de lo que pagás)'
    : `${anios > 0 ? anios + ' año' + (anios > 1 ? 's' : '') + ' y ' : ''}${mesesResto} mes${mesesResto !== 1 ? 'es' : ''}`;

  document.getElementById('calc-resultado').innerHTML = `
    <div class="resultado-calc">
      <div class="resultado-fila malo">
        <span>Pagando solo el mínimo terminás en</span>
        <strong>${tiempo}</strong>
      </div>
      <div class="resultado-fila malo">
        <span>Total que vas a pagar</span>
        <strong>${formatPesos(totalPagado)}</strong>
      </div>
      <div class="resultado-fila malo">
        <span>Solo en intereses</span>
        <strong>${formatPesos(interesesTotales)}</strong>
      </div>
      ${meses < MAX_MESES && ahorro > 0 ? `
        <div class="divider"></div>
        <div class="resultado-fila bueno">
          <span>Si pagás el doble (${formatPesos(pagarDoble)}/mes)</span>
          <strong>terminás en ${meses2} meses</strong>
        </div>
        <div class="resultado-fila bueno">
          <span>Te ahorrás</span>
          <strong>${formatPesos(ahorro)}</strong>
        </div>
      ` : ''}
    </div>
  `;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

function init() {
  track('session_start');
  const estado = cargar();
  if (estado.mesCerrado) {
    renderMesCerrado();
  } else if (estado.deudas?.length > 0 && estado.mensual > 0) {
    renderPlanMes(false);
  } else {
    reiniciar();
  }
}

init();
