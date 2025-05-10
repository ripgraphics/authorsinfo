-- Event System Enhancements
-- Adds advanced ticketing, payment processing, and permission controls

-- =====================
-- PERMISSIONS & ACCESS CONTROL
-- =====================

-- Event Creator Permissions
CREATE TABLE event_creator_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_level TEXT CHECK (permission_level IN ('admin', 'organizer', 'staff', 'limited')),
  can_create_paid_events BOOLEAN DEFAULT false,
  attendee_limit INTEGER DEFAULT 100,
  requires_approval BOOLEAN DEFAULT true,
  approved_categories UUID[] DEFAULT '{}'::UUID[], -- Specific categories user can create events for
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_creator_permissions_user_id ON event_creator_permissions(user_id);
CREATE UNIQUE INDEX idx_unique_creator_permission ON event_creator_permissions(user_id);

-- Event Permission Requests (for users who want to create events)
CREATE TABLE event_permission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_reason TEXT,
  requested_level TEXT CHECK (requested_level IN ('organizer', 'staff', 'limited')),
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_permission_requests_user_id ON event_permission_requests(user_id);
CREATE INDEX idx_event_permission_requests_status ON event_permission_requests(status);

-- Event Approval Workflow
CREATE TABLE event_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(id),
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected', 'changes_requested')),
  reviewer_id UUID REFERENCES users(id),
  review_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_approvals_event_id ON event_approvals(event_id);
CREATE INDEX idx_event_approvals_approval_status ON event_approvals(approval_status);
CREATE UNIQUE INDEX idx_unique_event_approval ON event_approvals(event_id);

-- Staff Assignments (for events with staff members)
CREATE TABLE event_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT CHECK (role IN ('organizer', 'co-organizer', 'staff', 'check-in', 'moderator')),
  permissions JSONB, -- Specific permissions for this staff member
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_staff_event_id ON event_staff(event_id);
CREATE INDEX idx_event_staff_user_id ON event_staff(user_id);
CREATE UNIQUE INDEX idx_unique_event_staff ON event_staff(event_id, user_id);

-- =====================
-- ADVANCED TICKETING
-- =====================

-- Ticket Types
CREATE TABLE ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  quantity_total INTEGER,
  quantity_sold INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sale_start_date TIMESTAMP WITH TIME ZONE,
  sale_end_date TIMESTAMP WITH TIME ZONE,
  min_per_order INTEGER DEFAULT 1,
  max_per_order INTEGER DEFAULT 10,
  has_waitlist BOOLEAN DEFAULT false,
  includes_features JSONB, -- Premium features for this ticket type
  visibility TEXT CHECK (visibility IN ('public', 'private', 'hidden', 'code_required')),
  access_code TEXT, -- For private ticket types requiring access code
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ticket_types_event_id ON ticket_types(event_id);
CREATE INDEX idx_ticket_types_is_active ON ticket_types(is_active);

-- Ticket Tier Benefits
CREATE TABLE ticket_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ticket_benefits_ticket_type_id ON ticket_benefits(ticket_type_id);

-- Promo Codes
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL,
  applies_to_ticket_types UUID[] DEFAULT '{}'::UUID[], -- Empty means all ticket types
  max_uses INTEGER, -- NULL means unlimited
  current_uses INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_event_id ON promo_codes(event_id);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_is_active ON promo_codes(is_active);
CREATE UNIQUE INDEX idx_unique_event_promo_code ON promo_codes(event_id, code);

-- Tickets (individual tickets generated for purchases)
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
  registration_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  ticket_number TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('reserved', 'purchased', 'refunded', 'cancelled', 'checked_in')),
  purchase_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  attendee_name TEXT,
  attendee_email TEXT,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_in_by UUID REFERENCES users(id),
  qr_code TEXT,
  barcode TEXT,
  ticket_pdf_url TEXT,
  access_code TEXT, -- For private tickets
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_tickets_ticket_type_id ON tickets(ticket_type_id);
CREATE INDEX idx_tickets_registration_id ON tickets(registration_id);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_ticket_number ON tickets(ticket_number);

-- =====================
-- PAYMENT PROCESSING
-- =====================

-- Payment Methods
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_type TEXT CHECK (payment_type IN ('credit_card', 'paypal', 'bank_transfer', 'crypto', 'apple_pay', 'google_pay')),
  provider_payment_id TEXT, -- ID from payment provider
  nickname TEXT,
  last_four TEXT,
  expiry_date TEXT,
  is_default BOOLEAN DEFAULT false,
  billing_address JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_payment_type ON payment_methods(payment_type);

-- Payment Transactions
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  payment_method_id UUID REFERENCES payment_methods(id),
  transaction_type TEXT CHECK (transaction_type IN ('purchase', 'refund', 'partial_refund', 'chargeback')),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  fees NUMERIC DEFAULT 0,
  taxes NUMERIC DEFAULT 0,
  tax_details JSONB,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'disputed')),
  provider_transaction_id TEXT,
  payment_provider TEXT CHECK (payment_provider IN ('stripe', 'paypal', 'square', 'braintree', 'manual')),
  error_message TEXT,
  metadata JSONB,
  receipt_url TEXT,
  receipt_email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_event_id ON payment_transactions(event_id);
CREATE INDEX idx_payment_transactions_registration_id ON payment_transactions(registration_id);
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_transaction_type ON payment_transactions(transaction_type);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'cancelled', 'refunded')),
  due_date TIMESTAMP WITH TIME ZONE,
  paid_date TIMESTAMP WITH TIME ZONE,
  billing_address JSONB,
  line_items JSONB,
  notes TEXT,
  invoice_pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_event_id ON invoices(event_id);
CREATE INDEX idx_invoices_registration_id ON invoices(registration_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

-- =====================
-- FINANCIAL REPORTING
-- =====================

-- Event Financial Summary
CREATE TABLE event_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  total_revenue NUMERIC DEFAULT 0,
  total_fees NUMERIC DEFAULT 0,
  total_taxes NUMERIC DEFAULT 0,
  total_refunds NUMERIC DEFAULT 0,
  net_revenue NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  ticket_sales_breakdown JSONB, -- Revenue by ticket type
  payout_status TEXT CHECK (payout_status IN ('pending', 'processing', 'completed', 'failed')),
  payout_date TIMESTAMP WITH TIME ZONE,
  payout_method TEXT,
  payout_reference TEXT,
  organizer_fees NUMERIC DEFAULT 0, -- Platform fees to organizer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_financials_event_id ON event_financials(event_id);
CREATE UNIQUE INDEX idx_unique_event_financials ON event_financials(event_id);

-- =====================
-- ADDITIONAL FUNCTIONS & TRIGGERS
-- =====================

-- Function to update ticket quantity sold
CREATE OR REPLACE FUNCTION update_ticket_quantity_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'purchased') THEN
    -- Increment quantity sold for this ticket type
    UPDATE ticket_types
    SET quantity_sold = quantity_sold + 1
    WHERE id = NEW.ticket_type_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != 'purchased' AND NEW.status = 'purchased') THEN
    -- Increment quantity sold for this ticket type
    UPDATE ticket_types
    SET quantity_sold = quantity_sold + 1
    WHERE id = NEW.ticket_type_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'purchased' AND NEW.status IN ('refunded', 'cancelled')) THEN
    -- Decrement quantity sold for this ticket type
    UPDATE ticket_types
    SET quantity_sold = quantity_sold - 1
    WHERE id = NEW.ticket_type_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ticket_quantity_trigger
AFTER INSERT OR UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_ticket_quantity_sold();

-- Function to update financial summary when payment transactions occur
CREATE OR REPLACE FUNCTION update_event_financials()
RETURNS TRIGGER AS $$
DECLARE
  event_currency TEXT;
  ticket_type_id UUID;
  ticket_type_name TEXT;
  current_breakdown JSONB;
BEGIN
  -- Get event currency
  SELECT currency INTO event_currency FROM events WHERE id = NEW.event_id;
  
  -- Create financial record if it doesn't exist
  INSERT INTO event_financials (event_id, currency)
  VALUES (NEW.event_id, event_currency)
  ON CONFLICT (event_id) DO NOTHING;
  
  -- Handle different transaction types
  IF NEW.transaction_type = 'purchase' AND NEW.status = 'completed' THEN
    -- Get ticket type for this transaction
    SELECT t.ticket_type_id, tt.name INTO ticket_type_id, ticket_type_name
    FROM tickets t
    JOIN ticket_types tt ON t.ticket_type_id = tt.id
    WHERE t.registration_id = NEW.registration_id
    LIMIT 1;
    
    -- Get current breakdown
    SELECT ticket_sales_breakdown INTO current_breakdown
    FROM event_financials
    WHERE event_id = NEW.event_id;
    
    -- Update ticket breakdown
    IF current_breakdown IS NULL THEN
      current_breakdown := jsonb_build_object(ticket_type_id::text, jsonb_build_object(
        'name', ticket_type_name,
        'count', 1,
        'revenue', NEW.amount
      ));
    ELSE
      IF current_breakdown ? ticket_type_id::text THEN
        current_breakdown := jsonb_set(
          current_breakdown,
          ARRAY[ticket_type_id::text, 'count'],
          to_jsonb((current_breakdown -> ticket_type_id::text ->> 'count')::int + 1)
        );
        current_breakdown := jsonb_set(
          current_breakdown,
          ARRAY[ticket_type_id::text, 'revenue'],
          to_jsonb((current_breakdown -> ticket_type_id::text ->> 'revenue')::numeric + NEW.amount)
        );
      ELSE
        current_breakdown := current_breakdown || jsonb_build_object(
          ticket_type_id::text, jsonb_build_object(
            'name', ticket_type_name,
            'count', 1,
            'revenue', NEW.amount
          )
        );
      END IF;
    END IF;
    
    -- Update financial summary
    UPDATE event_financials
    SET total_revenue = total_revenue + NEW.amount,
        total_fees = total_fees + NEW.fees,
        total_taxes = total_taxes + NEW.taxes,
        net_revenue = net_revenue + (NEW.amount - NEW.fees - NEW.taxes),
        ticket_sales_breakdown = current_breakdown,
        updated_at = NOW()
    WHERE event_id = NEW.event_id;
    
  ELSIF NEW.transaction_type IN ('refund', 'partial_refund') AND NEW.status = 'completed' THEN
    -- Update financial summary for refunds
    UPDATE event_financials
    SET total_refunds = total_refunds + NEW.amount,
        net_revenue = net_revenue - NEW.amount,
        updated_at = NOW()
    WHERE event_id = NEW.event_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_financials_trigger
AFTER INSERT OR UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_event_financials();

-- Function to validate ticket purchase against available quantity
CREATE OR REPLACE FUNCTION validate_ticket_purchase()
RETURNS TRIGGER AS $$
DECLARE
  available_qty INTEGER;
  ticket_active BOOLEAN;
  sale_active BOOLEAN;
BEGIN
  -- Get available quantity and active status
  SELECT 
    (quantity_total - quantity_sold) AS qty_left,
    is_active,
    (CURRENT_TIMESTAMP BETWEEN sale_start_date AND sale_end_date) AS in_sales_period
  INTO available_qty, ticket_active, sale_active
  FROM ticket_types
  WHERE id = NEW.ticket_type_id;
  
  -- Check if ticket type is active
  IF NOT ticket_active THEN
    RAISE EXCEPTION 'This ticket type is not currently available for purchase';
  END IF;
  
  -- Check if sale period is active
  IF NOT sale_active THEN
    RAISE EXCEPTION 'Ticket sales are not active at this time';
  END IF;
  
  -- Check if tickets are available
  IF available_qty <= 0 THEN
    RAISE EXCEPTION 'No more tickets available for this ticket type';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_ticket_purchase_trigger
BEFORE INSERT ON tickets
FOR EACH ROW
WHEN (NEW.status = 'reserved')
EXECUTE FUNCTION validate_ticket_purchase();

-- Function to validate event creation permissions
CREATE OR REPLACE FUNCTION validate_event_creation()
RETURNS TRIGGER AS $$
DECLARE
  permission_record RECORD;
BEGIN
  -- Get permission level for this user
  SELECT * INTO permission_record
  FROM event_creator_permissions
  WHERE user_id = NEW.created_by;
  
  -- If no permission record found, user can't create events
  IF permission_record IS NULL THEN
    IF EXISTS (SELECT 1 FROM users WHERE id = NEW.created_by AND role_id = (SELECT id FROM roles WHERE name = 'admin')) THEN
      -- Admins can always create events
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'You do not have permission to create events';
    END IF;
  END IF;
  
  -- Check if user can create paid events
  IF NOT NEW.is_free AND NOT permission_record.can_create_paid_events THEN
    RAISE EXCEPTION 'You do not have permission to create paid events';
  END IF;
  
  -- Check if user can create events in this category
  IF NEW.category_id IS NOT NULL AND 
     permission_record.approved_categories IS NOT NULL AND 
     array_length(permission_record.approved_categories, 1) > 0 AND
     NOT (NEW.category_id = ANY(permission_record.approved_categories)) THEN
    RAISE EXCEPTION 'You do not have permission to create events in this category';
  END IF;
  
  -- If user requires approval, set initial status to draft
  IF permission_record.requires_approval THEN
    NEW.status := 'draft';
    
    -- Create approval record after event is created
    -- This has to be handled by a separate trigger because we need NEW.id
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_event_creation_trigger
BEFORE INSERT ON events
FOR EACH ROW
EXECUTE FUNCTION validate_event_creation();

-- Create approval record after event creation
CREATE OR REPLACE FUNCTION create_event_approval_record()
RETURNS TRIGGER AS $$
DECLARE
  permission_record RECORD;
BEGIN
  -- Get permission level for this user
  SELECT * INTO permission_record
  FROM event_creator_permissions
  WHERE user_id = NEW.created_by;
  
  -- If user requires approval and is not an admin, create approval record
  IF permission_record IS NOT NULL AND permission_record.requires_approval AND
     NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.created_by AND role_id = (SELECT id FROM roles WHERE name = 'admin')) THEN
    
    INSERT INTO event_approvals (
      event_id, 
      submitted_by,
      approval_status,
      submitted_at
    ) VALUES (
      NEW.id,
      NEW.created_by,
      'pending',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_event_approval_trigger
AFTER INSERT ON events
FOR EACH ROW
EXECUTE FUNCTION create_event_approval_record(); 