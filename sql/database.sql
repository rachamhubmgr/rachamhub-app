---- public.customer_inquiries ----
CREATE TABLE public.customer_inquiries (
  \ nid uuid,
  customer_name text,
  customer_email text,
  subject text,
  message text,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);
ALTER TABLE public.customer_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_inquiries
ADD CONSTRAINT customer_inquiries_pkey PRIMARY KEY (id);
CREATE UNIQUE INDEX customer_inquiries_pkey ON public.customer_inquiries USING btree (id);
INSERT INTO public.customer_inquiries (
    id,
    customer_name,
    customer_email,
    subject,
    message,
    status,
    created_at,
    updated_at
  )
VALUES (
    '9c3a16ac-d8e5-4f77-a4dc-4da583e87cdd',
    'Demo Customer A',
    'demo.customer@example.com',
    'Question about shipping',
    'Can you confirm the delivery date for my order?',
    'open',
    '2026-05-25T17:33:37.461138+00:00',
    '2026-05-25T17:33:37.461138+00:00'
  );
INSERT INTO public.customer_inquiries (
    id,
    customer_name,
    customer_email,
    subject,
    message,
    status,
    created_at,
    updated_at
  )
VALUES (
    '67f67f12-c16a-45d8-bbb9-fc2b432d4426',
    'Warehouse Customer B',
    'warehouse.customer@example.com',
    'Order update needed',
    'Please update my order destination address.',
    'in_progress',
    '2026-05-25T17:33:37.461138+00:00',
    '2026-05-25T17:33:37.461138+00:00'
  );
INSERT INTO public.customer_inquiries (
    id,
    customer_name,
    customer_email,
    subject,
    message,
    status,
    created_at,
    updated_at
  )
VALUES (
    'a2d90777-db91-4c83-a680-be6f06b0d489',
    'Test Customer C',
    'test.customer@example.com',
    'Invoice clarification',
    'I need more information about the invoice total.',
    'open',
    '2026-05-25T17:33:37.461138+00:00',
    '2026-05-25T17:33:37.461138+00:00'
  );
---- public.orders ----
CREATE TABLE public.orders (
  \ nid uuid,
  customer_name text,
  delivery_address text,
  phone_numbers jsonb,
  merchant text,
  comment text,
  items jsonb,
  total_amount numeric(12, 2),
  warehouse_comment text,
  fom_assigned uuid,
  rider_name text,
  landmark text,
  payment_to_rider numeric(12, 2),
  payment_method text,
  payment_to_merchant numeric(12, 2),
  payment_confirmed boolean,
  bank text,
  fom_comment text,
  extracted_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  delivery_status delivery_status,
  inventory_status text not null default 'pending',
  fom_delivery_status text not null default 'pending',
  warehouse_status warehouse_status,
  status role
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders
ADD CONSTRAINT orders_extracted_by_fkey FOREIGN KEY (extracted_by) REFERENCES users(id) ON DELETE
SET NULL;
ALTER TABLE public.orders
ADD CONSTRAINT orders_fom_assigned_fkey FOREIGN KEY (fom_assigned) REFERENCES users(id) ON DELETE
SET NULL;
ALTER TABLE public.orders
ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id);
CREATE POLICY orders_dev_allow_all ON public.orders AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);
CREATE TABLE public.merchants (
  id uuid,
  name text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants
ADD CONSTRAINT merchants_pkey PRIMARY KEY (id);
CREATE UNIQUE INDEX merchants_name_key ON public.merchants USING btree (name);
CREATE POLICY merchants_dev_allow_all ON public.merchants AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);
CREATE TABLE public.settings (
  key text,
  value text,
  updated_at timestamp with time zone
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_dev_allow_all ON public.settings AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);
INSERT INTO public.orders (
    id,
    customer_name,
    delivery_address,
    phone_numbers,
    merchant,
    comment,
    items,
    total_amount,
    warehouse_comment,
    fom_assigned,
    rider_name,
    landmark,
    payment_to_rider,
    payment_method,
    payment_to_merchant,
    payment_confirmed,
    bank,
    fom_comment,
    extracted_by,
    created_at,
    updated_at,
    delivery_status,
    warehouse_status,
    status
  )
VALUES (
    '9d196375-f267-4902-8a48-4ba844e22b08',
    'Kolawole ishola',
    'NNPC Filling Station, Pako Ketu Bus-stop, Lagos-Badagry Expressway, Lagos State',
    '["08165912196"]',
    '[{"name": "PACK (4 PCS) OF LUMINOUS CAR VALVE LIGHT", "quantity": 1}]',
    '15000.00',
    '0.00',
    '0.00',
    'false',
    '0b38089a-58c9-4383-9673-6555c0ef36f5',
    '2026-05-25T22:13:06.828+00:00',
    '2026-05-26T18:02:23.013666+00:00',
    'pending',
    'customer_service'
  );
INSERT INTO public.orders (
    id,
    customer_name,
    delivery_address,
    phone_numbers,
    merchant,
    comment,
    items,
    total_amount,
    warehouse_comment,
    fom_assigned,
    rider_name,
    landmark,
    payment_to_rider,
    payment_method,
    payment_to_merchant,
    payment_confirmed,
    bank,
    fom_comment,
    extracted_by,
    created_at,
    updated_at,
    delivery_status,
    warehouse_status,
    status
  )
VALUES (
    'd4a7c974-d98c-412f-9698-7981122d432c',
    'Warehouse Customer B',
    '14 Ilupeju Road, Ikeja, Lagos',
    '["08123456789"]',
    'Merchant B',
    '[{"name": "Product B", "quantity": 3}]',
    '300.00',
    '1ad7a604-0ebb-4d29-84c0-88e4866a455c',
    '0.00',
    '0.00',
    'false',
    '0b38089a-58c9-4383-9673-6555c0ef36f5',
    '2026-05-25T17:33:37.461138+00:00',
    '2026-05-26T18:02:31.43774+00:00',
    'pending',
    'customer_service'
  );
INSERT INTO public.orders (
    id,
    customer_name,
    delivery_address,
    phone_numbers,
    merchant,
    comment,
    items,
    total_amount,
    warehouse_comment,
    fom_assigned,
    rider_name,
    landmark,
    payment_to_rider,
    payment_method,
    payment_to_merchant,
    payment_confirmed,
    bank,
    fom_comment,
    extracted_by,
    created_at,
    updated_at,
    delivery_status,
    warehouse_status,
    status
  )
VALUES (
    'd4a7c974-d98c-412f-9698-7981122d432c',
    'Warehouse Customer B',
    '14 Ilupeju Road, Ikeja, Lagos',
    '["08123456789"]',
    'Merchant B',
    '[{"name": "Product B", "quantity": 3}]',
    '300.00',
    '1ad7a604-0ebb-4d29-84c0-88e4866a455c',
    '0.00',
    '0.00',
    'false',
    '0b38089a-58c9-4383-9673-6555c0ef36f5',
    '2026-05-25T17:33:37.461138+00:00',
    '2026-05-26T18:02:31.43774+00:00',
    'pending',
    'customer_service'
  );
---- public.users ----
CREATE TABLE public.users (
  \ nid uuid,
  email text,
  display_name text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  last_login timestamp with time zone,
  role role
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users
ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE public.users
ADD CONSTRAINT users_pkey PRIMARY KEY (id);
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);
CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);
CREATE POLICY users_dev_allow_all ON public.users AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);
INSERT INTO public.users (
    id,
    email,
    display_name,
    is_active,
    created_at,
    updated_at,
    last_login,
    role
  )
VALUES (
    '0b38089a-58c9-4383-9673-6555c0ef36f5',
    'cs@rachamhub.com',
    'Customer Service',
    'true',
    '2026-05-25T17:33:37.461138+00:00',
    '2026-05-25T17:33:37.461138+00:00',
    'customer_service'
  );
INSERT INTO public.users (
    id,
    email,
    display_name,
    is_active,
    created_at,
    updated_at,
    last_login,
    role
  )
VALUES (
    'beb9cc53-1b3c-4e07-8ab3-8df50ce33f56',
    'demo@rachamhub.com',
    'Demo User',
    'true',
    '2026-05-25T17:33:37.461138+00:00',
    '2026-05-25T17:33:37.461138+00:00',
    'customer_service'
  );
INSERT INTO public.users (
    id,
    email,
    display_name,
    is_active,
    created_at,
    updated_at,
    last_login,
    role
  )
VALUES (
    '1ad7a604-0ebb-4d29-84c0-88e4866a455c',
    'fom1@rachamhub.com',
    'FOM1 User',
    'true',
    '2026-05-25T17:33:37.461138+00:00',
    '2026-05-26T18:07:01.361497+00:00',
    'fom'
  );
INSERT INTO public.users (
    id,
    email,
    display_name,
    is_active,
    created_at,
    updated_at,
    last_login,
    role
  )
VALUES (
    '7bea9328-633c-43a8-84ac-98e7f2c6f171',
    'accounting@rachamhub.com',
    'Accounting User',
    'true',
    '2026-05-25T17:33:37.461138+00:00',
    '2026-05-26T18:07:08.398531+00:00',
    'accounting'
  );
INSERT INTO public.users (
    id,
    email,
    display_name,
    is_active,
    created_at,
    updated_at,
    last_login,
    role
  )
VALUES (
    '933575a0-4956-4b5f-be99-cb90ea4208fd',
    'warehouse@rachamhub.com',
    'Warehouse User',
    'true',
    '2026-05-25T17:33:37.461138+00:00',
    '2026-05-26T18:07:13.412348+00:00',
    'warehouse'
  );
INSERT INTO public.users (
    id,
    email,
    display_name,
    is_active,
    created_at,
    updated_at,
    last_login,
    role
  )
VALUES (
    '9650a0d5-3d41-4925-8e09-63f26eaac1a0',
    'fom2@rachamhub.com',
    'FOM2 User',
    'true',
    '2026-05-25T17:33:37.461138+00:00',
    '2026-05-26T18:07:19.785565+00:00',
    'fom'
  );
INSERT INTO public.users (
    id,
    email,
    display_name,
    is_active,
    created_at,
    updated_at,
    last_login,
    role
  )
VALUES (
    'f30256d1-7f76-41d6-8b81-8c255080a3af',
    'admin@rachamhub.com',
    'Admin User',
    'true',
    '2026-05-25T17:33:37.461138+00:00',
    '2026-05-26T18:07:27.866353+00:00',
    'admin'
  );