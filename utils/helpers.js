// Helper functions
export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('vi-VN');
};

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS không được hỗ trợ'));
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => reject(error)
    );
  });
};

export const validateAddress = (address) => {
  return address && address.trim().length > 0;
};