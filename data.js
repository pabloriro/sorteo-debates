/* ============================================================
   DATOS DEL SORTEO  ·  Edita aquí nombres y mociones
   (si cambias algo, el sorteo guardado se reinicia solo)
   ============================================================ */

const CONFIG = {
  titulo: "El Gran Sorteo del Debate",
  subtitulo: "3.º Medio · Debate Parlamentario Británico",
};

/* Parejas de debatientes (cada pareja = una celda de la tabla del Word) */
const PAREJAS = [
  ["Felipe Vasquez", "Mathias Orihuela"],
  ["Alexander Carnatron", "Sebastian Ramirez"],
  ["Jesus Panaspaico", "Luis Hernandez"],
  ["Valeria Berroteran", "Simon Perez"],
  ["Luis Cifuentes", "Agustin Iceta"],
  ["Angelica de Avila", "Joaquin Valduvinos"],
  ["Thiago Quiroz", "Juan Briones"],
  ["Sofia Reyes", "Mateo Tolentino"],
];

/* Jurados (lista "Jurados" del Word). Se sortean 3 para formar el trío del debate. */
const JURADOS = [
  "Pablo Guerrero",
  "Katherine Flores",
  "Shara Samiernto",
  "Josefina Acevedo",
  "Isabel Gil",
  "Valeria Muñoz",
];
const JUECES_POR_DEBATE = 3;

/* Mociones inventadas para 3.º Medio.
   t = moción · cat/emoji = tema · tipo = tipo de moción · ctx = pista para la preparación */
const MOCIONES = [
  { emoji: "📱", cat: "Educación", tipo: "Moción de política",
    t: "Esta Cámara prohibiría el uso de celulares en los colegios durante toda la jornada.",
    ctx: "Varios países ya lo hicieron. ¿Protege el aprendizaje o le quita libertad a los estudiantes?" },
  { emoji: "🗳️", cat: "Política", tipo: "Moción de política",
    t: "Esta Cámara bajaría la edad mínima para votar a los 16 años.",
    ctx: "Los jóvenes viven las consecuencias de las decisiones, pero ¿están listos para tomarlas?" },
  { emoji: "🤖", cat: "Tecnología", tipo: "Moción de política",
    t: "Esta Cámara permitiría el uso de inteligencia artificial en todas las evaluaciones escolares.",
    ctx: "¿Se evalúa lo que sabes o lo bien que usas la herramienta?" },
  { emoji: "📝", cat: "Educación", tipo: "Moción de política",
    t: "Esta Cámara eliminaría las notas numéricas y las reemplazaría por evaluaciones con retroalimentación.",
    ctx: "¿Un 5,8 dice realmente cuánto aprendiste?" },
  { emoji: "🎓", cat: "Educación", tipo: "Moción de política",
    t: "Esta Cámara eliminaría la PAES como requisito para ingresar a la universidad.",
    ctx: "Piensa en qué otro sistema de admisión podría reemplazarla y a quién beneficiaría." },
  { emoji: "⏰", cat: "Educación", tipo: "Moción de política",
    t: "Esta Cámara haría que las clases comiencen a las 9:30 de la mañana.",
    ctx: "Sueño adolescente versus los horarios de trabajo de las familias." },
  { emoji: "👕", cat: "Sociedad", tipo: "Moción de política",
    t: "Esta Cámara eliminaría el uniforme escolar obligatorio.",
    ctx: "Igualdad, identidad, costos y libertad: ¿qué pesa más?" },
  { emoji: "📵", cat: "Redes sociales", tipo: "Moción de actor",
    t: "Esta Cámara, siendo el Gobierno, prohibiría las redes sociales a menores de 16 años.",
    ctx: "Decides desde los intereses del Gobierno: proteger a los menores, pero ¿se puede hacer cumplir?" },
  { emoji: "🚫", cat: "Redes sociales", tipo: "Moción de lamentar",
    t: "Esta Cámara lamenta la cultura de la cancelación en redes sociales.",
    ctx: "Debes comparar el mundo actual con uno donde no existiera la cancelación." },
  { emoji: "🤳", cat: "Cultura juvenil", tipo: "Moción de lamentar",
    t: "Esta Cámara lamenta que ser influencer sea la meta profesional de muchos jóvenes.",
    ctx: "¿Es un sueño legítimo o una ilusión que desplaza otras oportunidades?" },
  { emoji: "🎰", cat: "Ética", tipo: "Moción de política",
    t: "Esta Cámara prohibiría a los influencers promocionar apuestas en línea y criptomonedas.",
    ctx: "Libertad de expresión, responsabilidad y audiencias muy jóvenes." },
  { emoji: "📰", cat: "Ética", tipo: "Moción de política",
    t: "Esta Cámara castigaría con cárcel a quienes creen y difundan noticias falsas a propósito.",
    ctx: "¿Quién decide qué es verdad? ¿Y dónde termina la libertad de opinión?" },
  { emoji: "📹", cat: "Seguridad", tipo: "Moción de política",
    t: "Esta Cámara instalaría cámaras de reconocimiento facial en las calles para combatir el delito.",
    ctx: "Seguridad frente a privacidad: ambas importan, ¿cuál pesa más?" },
  { emoji: "🗓️", cat: "Economía", tipo: "Moción de política",
    t: "Esta Cámara establecería la semana laboral de cuatro días.",
    ctx: "Más descanso y bienestar, pero ¿qué pasa con las empresas pequeñas?" },
  { emoji: "🧭", cat: "Política", tipo: "Moción de política",
    t: "Esta Cámara haría obligatorio un servicio cívico de seis meses al terminar cuarto medio.",
    ctx: "Servir al país, aprender a convivir… o perder tiempo y libertad." },
  { emoji: "🚗", cat: "Medio ambiente", tipo: "Moción de política",
    t: "Esta Cámara prohibiría los autos particulares en el centro de las grandes ciudades.",
    ctx: "Aire limpio y calles para las personas frente a quienes dependen del auto." },
  { emoji: "🎆", cat: "Medio ambiente", tipo: "Moción de política",
    t: "Esta Cámara prohibiría los fuegos artificiales en Año Nuevo.",
    ctx: "Tradición y celebración frente a mascotas, fauna y contaminación." },
  { emoji: "🦁", cat: "Ética animal", tipo: "Moción de política",
    t: "Esta Cámara prohibiría los zoológicos.",
    ctx: "Conservación y educación versus los derechos de los animales." },
  { emoji: "🍟", cat: "Salud", tipo: "Moción de política",
    t: "Esta Cámara prohibiría la venta de comida chatarra en los alrededores de los colegios.",
    ctx: "Salud pública, kioscos y pequeños negocios del barrio." },
  { emoji: "🎮", cat: "Deporte", tipo: "Moción de análisis",
    t: "Esta Cámara apoya que los eSports sean considerados un deporte olímpico.",
    ctx: "Tienes que definir qué es un deporte… y defender tu definición." },
  { emoji: "⚽", cat: "Deporte", tipo: "Moción de política",
    t: "Esta Cámara haría que los hinchas sean los dueños de los clubes de fútbol.",
    ctx: "Pasión de la hinchada frente a la plata y la gestión de un club." },
  { emoji: "🔮", cat: "Futuro", tipo: "Moción de predecir",
    t: "Esta Cámara predice que, en veinte años, la inteligencia artificial hará más difícil que los jóvenes encuentren trabajo.",
    ctx: "No se trata de si es bueno o malo, sino de probar que va a pasar." },
  { emoji: "🏠", cat: "Educación", tipo: "Moción de actor",
    t: "Esta Cámara, siendo un estudiante de tercero medio, preferiría estudiar 100 % en línea desde la casa.",
    ctx: "Decides con los valores e intereses de un estudiante como tú." },
  { emoji: "🎒", cat: "Educación", tipo: "Moción de política",
    t: "Esta Cámara prohibiría las tareas para la casa.",
    ctx: "¿Refuerzan lo aprendido o le roban tiempo a la vida?" },
];
