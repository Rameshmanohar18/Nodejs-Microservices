//  3. EVENTS Folder (Event-Driven Architecture)
// What it does: Triggers actions based on what happened (decoupled from who triggered it)

const EventEmitter = require('events');

class AppEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Prevent memory leak warnings
  }
}

const eventEmitter = new AppEventEmitter();

module.exports = eventEmitter;