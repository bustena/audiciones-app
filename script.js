const hojaURLs = {
  H1tr1: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb2p1IwuAK7jqnep9w4K5Vnmi-66ugFXv8JYTWRuDEIWDv7hGGlj7qk6SyU7ulW9DklaZ4-vIuehou/pub?gid=0&single=true&output=csv',
  H1tr2: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb2p1IwuAK7jqnep9w4K5Vnmi-66ugFXv8JYTWRuDEIWDv7hGGlj7qk6SyU7ulW9DklaZ4-vIuehou/pub?gid=355259796&single=true&output=csv',
  H1tr3: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb2p1IwuAK7jqnep9w4K5Vnmi-66ugFXv8JYTWRuDEIWDv7hGGlj7qk6SyU7ulW9DklaZ4-vIuehou/pub?gid=923004067&single=true&output=csv',
  H2tr1: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb2p1IwuAK7jqnep9w4K5Vnmi-66ugFXv8JYTWRuDEIWDv7hGGlj7qk6SyU7ulW9DklaZ4-vIuehou/pub?gid=991944699&single=true&output=csv',
  H2tr2: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb2p1IwuAK7jqnep9w4K5Vnmi-66ugFXv8JYTWRuDEIWDv7hGGlj7qk6SyU7ulW9DklaZ4-vIuehou/pub?gid=1251501192&single=true&output=csv',
  H2tr3: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTb2p1IwuAK7jqnep9w4K5Vnmi-66ugFXv8JYTWRuDEIWDv7hGGlj7qk6SyU7ulW9DklaZ4-vIuehou/pub?gid=1487547326&single=true&output=csv'
};

let datos = [], actual = -1, anterior = -1, aciertos = 0, fallos = 0;
let cuentaIntervalo, audioTimeout;
const CONS = 40;

function iniciarSesion(clave) {
  document.getElementById('cargando').classList.remove('hidden');

  fetch(hojaURLs[clave])
    .then(res => res.text())
    .then(texto => {
      const resultado = Papa.parse(texto, { header: true, skipEmptyLines: true });
      datos = resultado.data.map(obj => ({
        autor: obj.Autor,
        obra: obj.Obra,
        url_audio: obj.URL_audio,
        e_url: obj.E_url
      }));

      // Ocultar botoneras y títulos, mostrar interfaz de audición
      document.querySelectorAll('.botonera').forEach(b => b.classList.add('hidden'));
      document.querySelectorAll('h2').forEach(h => h.classList.add('hidden'));
      document.getElementById('pantalla-audicion').classList.remove('hidden');
      document.getElementById('contador').classList.remove('hidden');
      document.getElementById('boton-finalizar').classList.remove('hidden');

      // Generar opciones
      generarOpciones();

      // Dar tiempo al navegador para renderizar antes de lanzar audio
      setTimeout(() => {
        document.getElementById('cargando').classList.add('hidden');
        siguienteAudicion();
      }, 0);
    });
}

function generarOpciones() {
  const contenedor = document.getElementById('lista-opciones');
  contenedor.innerHTML = '';
  datos.forEach((entrada, i) => {
    const fila = document.createElement('div');
    fila.className = 'opcion-container';
    const boton = document.createElement('button');
    boton.textContent = `${i + 1}. ${entrada.autor}: ${entrada.obra}`;
    boton.className = 'opcion';
    boton.onclick = () => evaluarRespuesta(i, boton);
    const enlace = document.createElement('a');
    enlace.href = entrada.e_url;
    enlace.textContent = 'ℹ️';
    enlace.className = 'info-link';
    enlace.target = '_blank';
    fila.appendChild(boton);
    fila.appendChild(enlace);
    contenedor.appendChild(fila);
  });
}

function siguienteAudicion() {
  const audio = document.getElementById('audio');
  clearInterval(cuentaIntervalo);
  clearTimeout(audioTimeout);
  audio.pause();
  audio.src = '';
  document.getElementById('cuenta-atras').textContent = '';
  document.getElementById('indicador-audio').classList.add('hidden');
  document.getElementById('feedback').classList.add('hidden');
  document.getElementById('boton-siguiente').classList.add('hidden');

  do {
    actual = Math.floor(Math.random() * datos.length);
  } while (actual === anterior && datos.length > 1);
  anterior = actual;

  const entrada = datos[actual];
  audio.src = entrada.url_audio;
  audio.load();

  document.querySelectorAll('.opcion').forEach(btn => {
    btn.disabled = false;
    btn.style.backgroundColor = '';
    btn.style.color = '';
  });

  audio.addEventListener('loadedmetadata', function reproducir() {
    const duracion = audio.duration;
    const inicio = duracion > CONS ? Math.random() * (duracion - CONS) : 0;
    audio.currentTime = inicio;
    audio.volume = 1;
    audio.play();

    document.getElementById('indicador-audio').classList.remove('hidden');
    let restantes = CONS;
    document.getElementById('cuenta-atras').textContent = `${restantes}s`;

    cuentaIntervalo = setInterval(() => {
      restantes--;
      document.getElementById('cuenta-atras').textContent = `${restantes}s`;
    }, 1000);

    audioTimeout = setTimeout(() => {
      clearInterval(cuentaIntervalo);
      document.getElementById('cuenta-atras').textContent = '';
      document.getElementById('indicador-audio').classList.add('hidden');
      audio.pause();
      mostrarFeedback(false, `⏱️ Tiempo agotado. Era: ${entrada.autor}: ${entrada.obra}`);
    }, CONS * 1000);

    audio.removeEventListener('loadedmetadata', reproducir);
  });
}

function evaluarRespuesta(indice, boton) {
  clearInterval(cuentaIntervalo);
  clearTimeout(audioTimeout);
  document.getElementById('cuenta-atras').textContent = '';
  document.getElementById('indicador-audio').classList.add('hidden');
  document.getElementById('audio').pause();

  const correcta = indice === actual;
  if (correcta) {
    aciertos++;
    boton.style.backgroundColor = '#00aa55';
    boton.style.color = 'white';
    mostrarFeedback(true, '✔️ ¡Correcto!');
  } else {
    fallos++;
    boton.style.backgroundColor = '#cc3333';
    boton.style.color = 'white';

    // Marcar también la opción correcta en verde
    const botones = document.querySelectorAll('.opcion');
    const botonCorrecto = botones[actual];
    botonCorrecto.style.backgroundColor = '#00aa55';
    botonCorrecto.style.color = 'white';

    mostrarFeedback(false, `✖️ Incorrecto. Era: ${datos[actual].autor}: ${datos[actual].obra}`);
  }
}

function mostrarFeedback(ok, mensaje) {
  document.querySelectorAll('.opcion').forEach(btn => btn.disabled = true);
  const f = document.getElementById('feedback');
  f.textContent = mensaje;
  f.classList.remove('hidden');
  document.getElementById('contador').textContent = `Aciertos: ${aciertos} · Fallos: ${fallos}`;
  document.getElementById('boton-siguiente').classList.remove('hidden');
}

function finalizar() {
  const audio = document.getElementById('audio');
  clearInterval(cuentaIntervalo);
  clearTimeout(audioTimeout);
  audio.pause();
  audio.src = '';
  aciertos = 0;
  fallos = 0;
  document.getElementById('contador').textContent = 'Aciertos: 0 · Fallos: 0';
  document.getElementById('pantalla-audicion').classList.add('hidden');
  document.querySelectorAll('.botonera').forEach(b => b.classList.remove('hidden'));
  document.querySelectorAll('h2').forEach(h => h.classList.remove('hidden'));
  document.getElementById('cargando').classList.add('hidden');
  document.getElementById('feedback').classList.add('hidden');
  document.getElementById('boton-siguiente').classList.add('hidden');
}
