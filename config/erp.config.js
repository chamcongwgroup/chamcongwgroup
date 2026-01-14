// Cấu hình kết nối ERP
const erpConfig = {
  domain: {
    url: process.env.NEXT_PUBLIC_ERP_URL || 'https://erp.wgroup.vn',
    apiEndpoint: process.env.NEXT_PUBLIC_ERP_API_ENDPOINT || '/jsonrpc',
  },
  
  odoo: {
    database: process.env.NEXT_PUBLIC_ODOO_DB || 'erp',
  },
  
  methods: {
    authenticate: 'authenticate',
    checkIn: 'check_in',
    checkOut: 'check_out',
    getStatus: 'get_status',
  },
  
  models: {
    attendance: 'hr.attendance',
    employee: 'hr.employee',
  }
};

export default erpConfig;