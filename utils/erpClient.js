import erpConfig from '../config/erp.config';

export class ERPClient {
  constructor() {
    this.apiUrl = `${erpConfig.domain.url}${erpConfig.domain.apiEndpoint}`;
    this.sessionId = null;
    this.uid = null;
  }

  async call(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: Date.now()
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.sessionId && { 'X-Session-Id': this.sessionId }),
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      return data.result;
    } catch (error) {
      console.error('ERP API Error:', error);
      throw error;
    }
  }

  async authenticate(username, password) {
    const result = await this.call('call', {
      service: 'common',
      method: 'authenticate',
      args: [erpConfig.odoo.database, username, password, {}]
    });
    
    if (result) {
      this.uid = result;
      return { success: true, uid: result };
    }
    
    return { success: false };
  }

  async checkIn(address, lat, lng) {
    return await this.call('call', {
      service: 'object',
      method: 'execute_kw',
      args: [
        erpConfig.odoo.database,
        this.uid,
        '',
        erpConfig.models.attendance,
        erpConfig.methods.checkIn,
        [],
        { address, latitude: lat, longitude: lng }
      ]
    });
  }

  async checkOut(address, lat, lng) {
    return await this.call('call', {
      service: 'object',
      method: 'execute_kw',
      args: [
        erpConfig.odoo.database,
        this.uid,
        '',
        erpConfig.models.attendance,
        erpConfig.methods.checkOut,
        [],
        { address, latitude: lat, longitude: lng }
      ]
    });
  }
}

export const erpClient = new ERPClient();