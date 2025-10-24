import { PRICING, VEHICLE_TYPES } from '../config/constants.js';

class PricingService {
  calculatePrice(distanceKm, vehicleType = VEHICLE_TYPES.NORMAL) {
    const distance = parseFloat(distanceKm);
    let calculatedPrice = PRICING.BASE_FARE + (distance * PRICING.PRICE_PER_KM);
    
    if (vehicleType === VEHICLE_TYPES.HEAVY) {
      calculatedPrice *= PRICING.HEAVY_MULTIPLIER;
    } else if (vehicleType === VEHICLE_TYPES.EMERGENCY) {
      calculatedPrice *= PRICING.EMERGENCY_MULTIPLIER;
    }
    
    return Math.max(calculatedPrice, PRICING.MINIMUM_FARE).toFixed(2);
  }

  formatPrice(price) {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  }

  getPriceBreakdown(distanceKm, vehicleType = VEHICLE_TYPES.NORMAL) {
    const distance = parseFloat(distanceKm);
    const baseFare = PRICING.BASE_FARE;
    let distanceFare = distance * PRICING.PRICE_PER_KM;
    
    let multiplier = 1.0;
    if (vehicleType === VEHICLE_TYPES.HEAVY) {
      multiplier = PRICING.HEAVY_MULTIPLIER;
    } else if (vehicleType === VEHICLE_TYPES.EMERGENCY) {
      multiplier = PRICING.EMERGENCY_MULTIPLIER;
    }
    
    const total = this.calculatePrice(distanceKm, vehicleType);

    return {
      baseFare: baseFare.toFixed(2),
      distanceFare: distanceFare.toFixed(2),
      multiplier: multiplier,
      distance: distance.toFixed(2),
      vehicleType: vehicleType,
      total,
      formatted: this.formatPrice(total),
    };
  }
}
export default new PricingService();
