class MemoryStorage {
  constructor() {
    this.conversations = new Map();
    this.rides = [];
    this.scheduledRides = new Map();
  }

  getConversationState(phoneNumber) {
    return this.conversations.get(phoneNumber) || {
      state: 'idle',
      data: {},
    };
  }

  setConversationState(phoneNumber, state, data = {}) {
    const existing = this.getConversationState(phoneNumber);
    this.conversations.set(phoneNumber, {
      state,
      data: { ...existing.data, ...data },
    });
  }

  clearConversation(phoneNumber) {
    this.conversations.delete(phoneNumber);
  }

  addRide(ride) {
    const rideWithId = {
      ...ride,
      id: this.rides.length + 1,
      createdAt: new Date().toISOString(),
    };
    this.rides.push(rideWithId);
    return rideWithId;
  }

  getRides(filter = {}) {
    return this.rides.filter(ride => {
      return Object.entries(filter).every(([key, value]) => ride[key] === value);
    });
  }

  updateRideStatus(rideId, status) {
    const ride = this.rides.find(r => r.id === rideId);
    if (ride) {
      ride.status = status;
      ride.updatedAt = new Date().toISOString();
    }
    return ride;
  }

  addScheduledRide(phoneNumber, rideData, scheduledTime) {
    this.scheduledRides.set(phoneNumber, {
      rideData,
      scheduledTime,
    });
  }

  getScheduledRides() {
    return Array.from(this.scheduledRides.entries());
  }

  removeScheduledRide(phoneNumber) {
    this.scheduledRides.delete(phoneNumber);
  }
}

module.exports = new MemoryStorage();
