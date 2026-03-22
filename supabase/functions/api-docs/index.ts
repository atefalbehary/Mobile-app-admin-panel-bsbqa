const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Real Estate Admin Panel API',
    description: `Complete API documentation for the Real Estate Admin Panel.\n\n## Authentication\nAll endpoints require a valid Supabase JWT token passed as a Bearer token in the Authorization header, unless noted otherwise.\n\n## Base URL\nAll requests go to: \`${SUPABASE_URL}/rest/v1/\`\n\n## Required Headers\n- \`apikey\`: \`${ANON_KEY}\`\n- \`Authorization\`: \`Bearer <user_jwt_token>\`\n- \`Content-Type\`: \`application/json\`\n- \`Prefer\`: \`return=representation\` (for INSERT/UPDATE to return the result)\n\n## Filtering\nSupabase REST uses PostgREST query syntax:\n- \`?column=eq.value\` — equals\n- \`?column=neq.value\` — not equals\n- \`?column=gt.value\` — greater than\n- \`?column=gte.value\` — greater than or equal\n- \`?column=lt.value\` — less than\n- \`?column=in.(val1,val2)\` — in list\n- \`?column=like.*pattern*\` — pattern match\n- \`?column=is.null\` — is null\n- \`?order=column.desc\` — ordering\n- \`?limit=10&offset=0\` — pagination\n- \`?select=col1,col2\` — column selection`,
    version: '1.0.0',
    contact: { name: 'Admin', email: 'admin@example.com' },
  },
  servers: [
    { url: `${SUPABASE_URL}/rest/v1`, description: 'Supabase REST API' },
  ],
  components: {
    securitySchemes: {
      apiKey: { type: 'apiKey', in: 'header', name: 'apikey', description: 'Supabase anon/public key' },
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Supabase user JWT token' },
    },
    schemas: {
      Profile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', nullable: true },
          user_type: { type: 'string', enum: ['user', 'agent', 'agency'] },
          approval_status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'suspended'] },
          is_active: { type: 'boolean' },
          agency_name: { type: 'string', nullable: true },
          company_name: { type: 'string', nullable: true },
          trade_license_url: { type: 'string', nullable: true },
          brokerage_license_url: { type: 'string', nullable: true },
          cr_url: { type: 'string', nullable: true },
          establishment_card_url: { type: 'string', nullable: true },
          authorized_signatory_id_url: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Property: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          name_ar: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
          description_ar: { type: 'string', nullable: true },
          location: { type: 'string', nullable: true },
          location_ar: { type: 'string', nullable: true },
          price: { type: 'number', nullable: true },
          currency: { type: 'string', default: 'QAR' },
          property_type: { type: 'string', enum: ['apartment', 'villa', 'office', 'land', 'penthouse', 'townhouse', 'studio'], nullable: true },
          sale_type: { type: 'string', enum: ['sale', 'rent', 'both'], nullable: true },
          status: { type: 'string', enum: ['active', 'draft', 'sold', 'rented', 'inactive'], nullable: true },
          bedroom_count: { type: 'integer', nullable: true },
          bathroom_count: { type: 'integer', nullable: true },
          gross_area: { type: 'number', nullable: true },
          net_area: { type: 'number', nullable: true },
          balcony_size: { type: 'number', nullable: true },
          floor_number: { type: 'string', nullable: true },
          unit_number: { type: 'string', nullable: true },
          project: { type: 'string', nullable: true },
          amenities: { type: 'string', nullable: true },
          is_featured: { type: 'boolean', nullable: true },
          is_recommended: { type: 'boolean', nullable: true },
          mark_as_sold: { type: 'boolean', nullable: true },
          display_order: { type: 'integer', nullable: true },
          whatsapp_number: { type: 'string', nullable: true },
          link_360: { type: 'string', nullable: true },
          video_youtube_embed_link: { type: 'string', nullable: true },
          location_google_map_embed_link: { type: 'string', nullable: true },
          floor_plan_url: { type: 'string', nullable: true },
          unit_layout_url: { type: 'string', nullable: true },
          brochure_url: { type: 'string', nullable: true },
          similar_properties: { type: 'string', nullable: true },
          meta_title: { type: 'string', nullable: true },
          meta_title_ar: { type: 'string', nullable: true },
          meta_description: { type: 'string', nullable: true },
          meta_description_ar: { type: 'string', nullable: true },
          created_by: { type: 'string', format: 'uuid', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      PropertyImage: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          property_id: { type: 'string', format: 'uuid' },
          image_url: { type: 'string' },
          display_order: { type: 'integer', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          name_ar: { type: 'string', nullable: true },
          description: { type: 'string', nullable: true },
          description_ar: { type: 'string', nullable: true },
          location: { type: 'string', nullable: true },
          location_ar: { type: 'string', nullable: true },
          country: { type: 'string', nullable: true },
          status: { type: 'string', default: 'active' },
          is_recommended: { type: 'boolean' },
          image_url: { type: 'string', nullable: true },
          app_image_url: { type: 'string', nullable: true },
          banner_url: { type: 'string', nullable: true },
          video_url: { type: 'string', nullable: true },
          video_thumbnail_url: { type: 'string', nullable: true },
          link_360: { type: 'string', nullable: true },
          suggested_apartments: { type: 'string', nullable: true },
          end_date: { type: 'string', format: 'date', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      ProjectImage: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          project_id: { type: 'string', format: 'uuid' },
          image_url: { type: 'string' },
          image_type: { type: 'string', default: 'gallery' },
          display_order: { type: 'integer', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid', nullable: true },
          user_name: { type: 'string', nullable: true },
          property_id: { type: 'string', format: 'uuid', nullable: true },
          property_title: { type: 'string', nullable: true },
          date: { type: 'string', format: 'date' },
          time: { type: 'string', nullable: true },
          type: { type: 'string', default: 'visit' },
          status: { type: 'string', default: 'pending' },
          notes: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          title_ar: { type: 'string', nullable: true },
          body: { type: 'string', nullable: true },
          body_ar: { type: 'string', nullable: true },
          type: { type: 'string', default: 'push' },
          target: { type: 'string', default: 'all' },
          status: { type: 'string', default: 'draft' },
          source_type: { type: 'string', default: 'manual' },
          delivery_channel: { type: 'string', default: 'push' },
          trigger_type: { type: 'string', nullable: true },
          deep_link: { type: 'string', nullable: true },
          scheduled_at: { type: 'string', format: 'date-time', nullable: true },
          sent_at: { type: 'string', format: 'date-time', nullable: true },
          recipient_count: { type: 'integer', nullable: true },
          open_rate: { type: 'number', nullable: true },
          metadata: { type: 'object', nullable: true },
          created_by: { type: 'string', format: 'uuid', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      NotificationRule: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          trigger_type: { type: 'string' },
          audience: { type: 'string', default: 'all' },
          delivery_channel: { type: 'string', default: 'push' },
          is_enabled: { type: 'boolean' },
          template_title: { type: 'string', nullable: true },
          template_title_ar: { type: 'string', nullable: true },
          template_body: { type: 'string', nullable: true },
          template_body_ar: { type: 'string', nullable: true },
          trigger_count: { type: 'integer' },
          last_triggered_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      ContentItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          type: { type: 'string', default: 'popup' },
          status: { type: 'string', default: 'inactive' },
          image_url: { type: 'string', nullable: true },
          link: { type: 'string', nullable: true },
          start_date: { type: 'string', format: 'date', nullable: true },
          end_date: { type: 'string', format: 'date', nullable: true },
          views: { type: 'integer', nullable: true },
          clicks: { type: 'integer', nullable: true },
          created_by: { type: 'string', format: 'uuid', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      PropertyType: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          name_ar: { type: 'string', nullable: true },
          image_url: { type: 'string', nullable: true },
          is_active: { type: 'boolean', nullable: true },
          unit_count: { type: 'integer', nullable: true },
          display_order: { type: 'integer', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      RegisteredClient: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          agent_id: { type: 'string', format: 'uuid' },
          client_name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          project: { type: 'string' },
          nationality: { type: 'string' },
          apt_details: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      VisitSchedule: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          agent_id: { type: 'string', format: 'uuid', nullable: true },
          agent_name: { type: 'string' },
          project_name: { type: 'string' },
          unit_type: { type: 'string' },
          visit_date: { type: 'string', format: 'date' },
          phone_number: { type: 'string' },
          notes: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      AdminNotification: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string' },
          title: { type: 'string' },
          message: { type: 'string' },
          is_read: { type: 'boolean' },
          metadata: { type: 'object', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      ChatMessage: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          sender_id: { type: 'string', format: 'uuid', description: 'The user ID of the message sender' },
          sender_name: { type: 'string', description: 'Display name of the sender' },
          sender_type: { type: 'string', enum: ['user', 'agent', 'agency', 'admin'], description: 'Type of sender' },
          receiver_id: { type: 'string', format: 'uuid', nullable: true, description: 'The user ID of the recipient (used for admin replies)' },
          message: { type: 'string', description: 'Message content' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      AuthSignUp: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          data: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              phone: { type: 'string' },
              user_type: { type: 'string', enum: ['user', 'agent', 'agency'] },
            },
          },
        },
      },
      AuthSignIn: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    },
  },
  security: [{ apiKey: [] }, { bearerAuth: [] }],
  paths: {} as Record<string, unknown>,
};

// Helper to generate CRUD paths for a table
function crudPaths(
  tableName: string,
  schemaRef: string,
  tag: string,
  description: string,
  opts?: { noDelete?: boolean; noInsert?: boolean; noUpdate?: boolean; publicRead?: boolean }
) {
  const ref = { $ref: `#/components/schemas/${schemaRef}` };
  const paths: Record<string, unknown> = {};

  const listPath: Record<string, unknown> = {
    get: {
      tags: [tag],
      summary: `List ${description}`,
      description: `Retrieve a list of ${description}. Supports PostgREST filtering, ordering, and pagination.`,
      parameters: [
        { name: 'select', in: 'query', schema: { type: 'string' }, description: 'Columns to return' },
        { name: 'order', in: 'query', schema: { type: 'string' }, description: 'e.g. created_at.desc' },
        { name: 'limit', in: 'query', schema: { type: 'integer' }, description: 'Max rows' },
        { name: 'offset', in: 'query', schema: { type: 'integer' }, description: 'Skip rows' },
      ],
      responses: {
        '200': { description: 'Success', content: { 'application/json': { schema: { type: 'array', items: ref } } } },
        '401': { description: 'Unauthorized' },
      },
    },
  };

  if (!opts?.noInsert) {
    listPath.post = {
      tags: [tag],
      summary: `Create ${schemaRef}`,
      description: `Insert a new record. Include \`Prefer: return=representation\` header to get the created object back.`,
      parameters: [{ name: 'Prefer', in: 'header', schema: { type: 'string', default: 'return=representation' } }],
      requestBody: { required: true, content: { 'application/json': { schema: ref } } },
      responses: {
        '201': { description: 'Created', content: { 'application/json': { schema: ref } } },
        '401': { description: 'Unauthorized' },
        '409': { description: 'Conflict' },
      },
    };
  }

  paths[`/${tableName}`] = listPath;

  const itemPath: Record<string, unknown> = {
    get: {
      tags: [tag],
      summary: `Get ${schemaRef} by ID`,
      parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'string' }, description: 'e.g. id=eq.<uuid>' }],
      responses: {
        '200': { description: 'Success', content: { 'application/json': { schema: { type: 'array', items: ref } } } },
        '401': { description: 'Unauthorized' },
      },
    },
  };

  if (!opts?.noUpdate) {
    itemPath.patch = {
      tags: [tag],
      summary: `Update ${schemaRef}`,
      description: `Update by filter. e.g. PATCH /${tableName}?id=eq.<uuid>`,
      parameters: [
        { name: 'id', in: 'query', required: true, schema: { type: 'string' }, description: 'e.g. id=eq.<uuid>' },
        { name: 'Prefer', in: 'header', schema: { type: 'string', default: 'return=representation' } },
      ],
      requestBody: { required: true, content: { 'application/json': { schema: ref } } },
      responses: {
        '200': { description: 'Updated', content: { 'application/json': { schema: ref } } },
        '401': { description: 'Unauthorized' },
      },
    };
  }

  if (!opts?.noDelete) {
    itemPath.delete = {
      tags: [tag],
      summary: `Delete ${schemaRef}`,
      parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'string' }, description: 'e.g. id=eq.<uuid>' }],
      responses: {
        '204': { description: 'Deleted' },
        '401': { description: 'Unauthorized' },
      },
    };
  }

  // Use a query-based path representation
  paths[`/${tableName}?id=eq.{id}`] = itemPath;

  return paths;
}

// Build all paths
const allPaths: Record<string, unknown> = {};

// Auth paths (not PostgREST, but Supabase Auth API)
allPaths['/auth/v1/signup'] = {
  post: {
    tags: ['Authentication'],
    summary: 'Sign up a new user',
    description: `POST to \`${SUPABASE_URL}/auth/v1/signup\` with apikey header. A profile is auto-created via database trigger. User types: user (auto-approved), agent/agency (pending approval).`,
    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthSignUp' } } } },
    responses: {
      '200': { description: 'User created successfully' },
      '422': { description: 'Validation error' },
    },
  },
};
allPaths['/auth/v1/token?grant_type=password'] = {
  post: {
    tags: ['Authentication'],
    summary: 'Sign in (get JWT token)',
    description: `POST to \`${SUPABASE_URL}/auth/v1/token?grant_type=password\` with apikey header. Returns access_token to use as Bearer token.`,
    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthSignIn' } } } },
    responses: {
      '200': { description: 'Returns access_token, refresh_token, user object' },
      '400': { description: 'Invalid credentials' },
    },
  },
};
allPaths['/auth/v1/logout'] = {
  post: {
    tags: ['Authentication'],
    summary: 'Sign out',
    description: `POST to \`${SUPABASE_URL}/auth/v1/logout\` with Authorization header.`,
    responses: { '204': { description: 'Logged out' } },
  },
};
allPaths['/auth/v1/user'] = {
  get: {
    tags: ['Authentication'],
    summary: 'Get current user',
    description: `GET \`${SUPABASE_URL}/auth/v1/user\` with Authorization header. Returns the authenticated user.`,
    responses: { '200': { description: 'User object' }, '401': { description: 'Not authenticated' } },
  },
};

// Storage paths
allPaths['/storage/v1/object/{bucket}/{path}'] = {
  post: {
    tags: ['Storage'],
    summary: 'Upload a file',
    description: `Upload to \`${SUPABASE_URL}/storage/v1/object/{bucket}/{path}\`. Available buckets: \`documents\` (private), \`property-assets\` (public), \`content-images\` (public). Use multipart/form-data.`,
    parameters: [
      { name: 'bucket', in: 'path', required: true, schema: { type: 'string', enum: ['documents', 'property-assets', 'content-images'] } },
      { name: 'path', in: 'path', required: true, schema: { type: 'string' }, description: 'File path within bucket' },
    ],
    requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } } },
    responses: { '200': { description: 'File uploaded' }, '401': { description: 'Unauthorized' } },
  },
  get: {
    tags: ['Storage'],
    summary: 'Download/view a file',
    description: 'For public buckets, use the public URL directly. For private buckets, include Authorization header.',
    parameters: [
      { name: 'bucket', in: 'path', required: true, schema: { type: 'string' } },
      { name: 'path', in: 'path', required: true, schema: { type: 'string' } },
    ],
    responses: { '200': { description: 'File content' } },
  },
};

// Table CRUD
Object.assign(allPaths, crudPaths('profiles', 'Profile', 'Users & Profiles', 'user profiles', { noDelete: true }));
Object.assign(allPaths, crudPaths('properties', 'Property', 'Properties', 'properties'));
Object.assign(allPaths, crudPaths('property_images', 'PropertyImage', 'Properties', 'property images'));
Object.assign(allPaths, crudPaths('projects', 'Project', 'Projects', 'projects'));
Object.assign(allPaths, crudPaths('project_images', 'ProjectImage', 'Projects', 'project images'));
Object.assign(allPaths, crudPaths('bookings', 'Booking', 'Bookings', 'bookings'));
Object.assign(allPaths, crudPaths('notifications', 'Notification', 'Notifications', 'notifications'));
Object.assign(allPaths, crudPaths('notification_rules', 'NotificationRule', 'Notifications', 'notification rules'));
Object.assign(allPaths, crudPaths('content_items', 'ContentItem', 'Content Manager', 'content items (popups/banners)'));
Object.assign(allPaths, crudPaths('property_types', 'PropertyType', 'Property Types', 'property types'));
Object.assign(allPaths, crudPaths('registered_clients', 'RegisteredClient', 'Agents & Clients', 'registered clients'));
Object.assign(allPaths, crudPaths('visit_schedules', 'VisitSchedule', 'Agents & Clients', 'visit schedules'));
Object.assign(allPaths, crudPaths('admin_notifications', 'AdminNotification', 'Admin Notifications', 'admin notifications'));
Object.assign(allPaths, crudPaths('user_roles', 'Profile', 'User Roles', 'user roles', { noDelete: true, noInsert: true, noUpdate: true }));
Object.assign(allPaths, crudPaths('chat_messages', 'ChatMessage', 'Chat', 'chat messages. Users send messages with their sender_id. Admin replies include receiver_id. Query with or filter: ?or=(sender_id.eq.USER_ID,receiver_id.eq.USER_ID) to get full conversation thread.'));

spec.paths = allPaths;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Return raw JSON spec
  if (url.searchParams.get('format') === 'json') {
    return new Response(JSON.stringify(spec, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Return Swagger UI HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Real Estate Admin API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; }
    .topbar { display: none !important; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      spec: ${JSON.stringify(spec)},
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
    });
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  });
});
