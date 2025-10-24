export const KEYWORDS = {
  START: [
    'chamar carro',
    'chamar um carro',
    'pedir carro',
    'quero um carro',
    'preciso de carro',
    'uber',
    'corrida',
    'nova corrida',
    'solicitar',
    'oi',
    'olá',
    'ola',
    'começar',
    'iniciar'
  ],
};

export const CONVERSATION_STATES = {
  IDLE: 'idle',
  WAITING_ORIGIN: 'waiting_origin',
  WAITING_DESTINATION: 'waiting_destination',
  WAITING_VEHICLE_TYPE: 'waiting_vehicle_type',
  WAITING_CONFIRMATION: 'waiting_confirmation',
  WAITING_SCHEDULE: 'waiting_schedule',
};

export const RIDE_STATUS = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const VEHICLE_TYPES = {
  NORMAL: 'Carro Normal',
  HEAVY: 'Veículo Pesado',
  EMERGENCY: 'Emergência',
};

export const PRICING = {
  BASE_FARE: 5.0,
  PRICE_PER_KM: 2.5,
  MINIMUM_FARE: 10.0,
  HEAVY_MULTIPLIER: 1.5,
  EMERGENCY_MULTIPLIER: 1.8,
};

export const MESSAGES = {
  WELCOME: 'Olá! Qual é o ponto de partida?',
  ASK_DESTINATION: 'Ótimo! Agora me informe o destino.',
  ASK_VEHICLE_TYPE: `🚗 Qual tipo de veículo você precisa?

1️⃣ Carro Normal - Viagens comuns
2️⃣ Veículo Pesado - Entregas, cargas
3️⃣ Emergência - Atendimento prioritário

Digite o número ou o nome do tipo.`,
  PROCESSING: 'Aguarde um momento, estou processando sua solicitação...',
  CALCULATING_ROUTE: '🗺️ Calculando a melhor rota...',
  ERROR_GEOCODING: 'Desculpe, não consegui localizar esse endereço. Pode tentar novamente?',
  ERROR_ROUTING: 'Desculpe, não consegui calcular a rota. Tente novamente.',
  ERROR_GENERAL: 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.',
  ASK_SCHEDULE_TIME: '📅 Para quando deseja agendar? (exemplo: "hoje 18:00" ou "amanhã 14:30")',
  RIDE_CONFIRMED: '✅ Corrida confirmada! O motorista foi notificado.',
  RIDE_SCHEDULED: '📅 Corrida agendada com sucesso!',
  RIDE_CANCELLED: '❌ Corrida cancelada. Digite "uber" quando quiser solicitar uma nova corrida.',
  INVALID_OPTION: 'Opção inválida. Digite "confirmar", "agendar" ou "cancelar".',
};
