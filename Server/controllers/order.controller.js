const { eventEmitter, ORDER_EVENTS } = require('../events/order.event');

class OrderController {
  async createOrder(req, res) {
    // 1. Save order to database
    const order = await Order.create({
      user: req.user.id,
      items: req.body.items,
      total: 1000
    });
    
    // 2. EMIT EVENT (not await the tasks)
    eventEmitter.emit(ORDER_EVENTS.CREATED, {
      id: order._id,
      userEmail: req.user.email,
      items: order.items,
      amount: order.total
    });
    
    // 3. Return response immediately (events run in background)
    res.status(201).json({
      success: true,
      order,
      message: "Order created! Emails and invoices will be sent shortly."
    });
  }
}