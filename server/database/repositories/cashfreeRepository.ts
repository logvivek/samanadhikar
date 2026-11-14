import { CashfreeOrderRecord, PaymentTransactionRecord } from "../../types";
import { initDatabase, persistDatabase } from "../connection";

export async function saveCashfreeOrder(order: CashfreeOrderRecord): Promise<void> {
  const db = initDatabase();
  const existingIdx = db.cashfreeOrders.findIndex((o) => o.orderId === order.orderId);
  if (existingIdx >= 0) {
    db.cashfreeOrders[existingIdx] = order;
  } else {
    db.cashfreeOrders.unshift(order);
  }
  // Keep last 500 orders in memory/file
  if (db.cashfreeOrders.length > 500) {
    db.cashfreeOrders = db.cashfreeOrders.slice(0, 500);
  }
  persistDatabase();
}

export async function getCashfreeOrder(orderId: string): Promise<CashfreeOrderRecord | null> {
  const db = initDatabase();
  return db.cashfreeOrders.find((o) => o.orderId === orderId) || null;
}

export async function updateCashfreeOrder(
  orderId: string,
  updates: Partial<CashfreeOrderRecord>
): Promise<CashfreeOrderRecord | null> {
  const db = initDatabase();
  const order = db.cashfreeOrders.find((o) => o.orderId === orderId);
  if (!order) return null;

  Object.assign(order, updates);
  persistDatabase();
  return order;
}

// =========================================================================
// PAYMENT TRANSACTIONS REPOSITORY (Payment Gateway v3 Ledger)
// =========================================================================

export async function createPaymentTransaction(
  tx: PaymentTransactionRecord
): Promise<PaymentTransactionRecord> {
  const db = initDatabase();
  const existing = db.paymentTransactions.find(
    (item) => item.cashfreeOrderId === tx.cashfreeOrderId || item.internalTransactionId === tx.internalTransactionId
  );
  if (existing) {
    return existing;
  }

  db.paymentTransactions.unshift(tx);
  if (db.paymentTransactions.length > 1000) {
    db.paymentTransactions = db.paymentTransactions.slice(0, 1000);
  }
  persistDatabase();
  return tx;
}

export async function getPaymentTransactionByOrderId(
  cashfreeOrderId: string
): Promise<PaymentTransactionRecord | null> {
  const db = initDatabase();
  return db.paymentTransactions.find((tx) => tx.cashfreeOrderId === cashfreeOrderId) || null;
}

export async function getPaymentTransactionById(
  internalTransactionId: string
): Promise<PaymentTransactionRecord | null> {
  const db = initDatabase();
  return db.paymentTransactions.find((tx) => tx.internalTransactionId === internalTransactionId) || null;
}

export async function getPaymentTransactionByCashfreePaymentId(
  cashfreePaymentId: string
): Promise<PaymentTransactionRecord | null> {
  const db = initDatabase();
  return db.paymentTransactions.find((tx) => tx.cashfreePaymentId === cashfreePaymentId) || null;
}

export async function getPaymentTransactionByIdempotencyKey(
  idempotencyKey: string
): Promise<PaymentTransactionRecord | null> {
  if (!idempotencyKey) return null;
  const db = initDatabase();
  return (
    db.paymentTransactions.find(
      (tx) => tx.idempotencyKey === idempotencyKey && tx.paymentStatus === "PENDING"
    ) || null
  );
}

export async function getAllPaymentTransactions(): Promise<PaymentTransactionRecord[]> {
  const db = initDatabase();
  return [...db.paymentTransactions];
}

export async function updatePaymentTransaction(
  cashfreeOrderId: string,
  updates: Partial<PaymentTransactionRecord>
): Promise<PaymentTransactionRecord | null> {
  const db = initDatabase();
  const tx = db.paymentTransactions.find((item) => item.cashfreeOrderId === cashfreeOrderId);
  if (!tx) return null;

  // Prevent overwriting a confirmed SUCCESS status back to FAILED/PENDING/CANCELLED
  if (tx.paymentStatus === "SUCCESS" && updates.paymentStatus && updates.paymentStatus !== "SUCCESS") {
    const { paymentStatus: _ignored, ...safeUpdates } = updates;
    Object.assign(tx, safeUpdates, { updatedDate: new Date().toISOString() });
  } else {
    Object.assign(tx, updates, { updatedDate: new Date().toISOString() });
  }

  persistDatabase();
  return tx;
}

export async function markWebhookEventProcessed(
  cashfreeOrderId: string,
  eventSignatureKey: string
): Promise<boolean> {
  const db = initDatabase();
  const tx = db.paymentTransactions.find((item) => item.cashfreeOrderId === cashfreeOrderId);
  if (!tx) return false;

  if (!Array.isArray(tx.processedWebhookEvents)) {
    tx.processedWebhookEvents = [];
  }
  if (tx.processedWebhookEvents.includes(eventSignatureKey)) {
    return false; // Duplicate event
  }

  tx.processedWebhookEvents.push(eventSignatureKey);
  tx.updatedDate = new Date().toISOString();
  persistDatabase();
  return true;
}
