CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  reference VARCHAR(80) NOT NULL UNIQUE,
  order_id BIGINT NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('BANK_TRANSFER', 'E_WALLET', 'CREDIT_CARD')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);


CREATE TABLE IF NOT EXISTS payment_order_events (
  event_id UUID PRIMARY KEY,
  order_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_order_events_order_id
ON payment_order_events (order_id);
