import React, { useState, useEffect, useCallback } from 'react'; // useCallback sudah diimpor
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setBalance, setLogout } from '../store/authSlice'; // Import setLogout
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PaymentPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, balance } = useSelector((state) => state.auth);
  // KOREKSI: Hapus showBalance dan setShowBalance jika tidak digunakan di halaman ini
  // const [showBalance, setShowBalance] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();

  // Base URL API
  const API_BASE_URL = 'https://take-home-test-api.nutech-integrasi.com';

  // Fungsi helper untuk konfigurasi header dengan token
  const getConfig = useCallback(() => ({ // Bungkus getConfig dalam useCallback
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  // Fetch saldo dan layanan saat komponen dimuat
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        // Fetch Balance
        const balanceResponse = await axios.get(`${API_BASE_URL}/balance`, getConfig()); // Menggunakan getConfig
        if (balanceResponse.data.status === 0) {
          dispatch(setBalance(balanceResponse.data.data.balance));
        } else {
          toast.error(balanceResponse.data.message || 'Gagal mengambil saldo.');
        }
        setLoadingBalance(false);

        // Fetch Services
        const servicesResponse = await axios.get(`${API_BASE_URL}/services`, getConfig()); // Menggunakan getConfig
        if (servicesResponse.data.status === 0) {
          setServices(servicesResponse.data.data);
          // Cek jika ada service_code di URL (dari HomePage)
          const params = new URLSearchParams(location.search);
          const serviceCodeFromUrl = params.get('service_code');
          if (serviceCodeFromUrl) {
            const preSelected = servicesResponse.data.data.find(
              (s) => s.service_code === serviceCodeFromUrl
            );
            if (preSelected) {
              setSelectedService(preSelected);
            }
          }
        } else {
          toast.error(servicesResponse.data.message || 'Gagal mengambil layanan.');
        }
        setLoadingServices(false);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Terjadi kesalahan saat memuat data.');
        console.error('Error fetching data:', error);
        if (error.response && error.response.status === 401) {
          toast.error('Sesi Anda berakhir. Silakan login kembali.');
          dispatch(setLogout()); // Tambahkan dispatch logout
          navigate('/login');
        }
      }
    };
    fetchData();
  }, [token, dispatch, navigate, location.search, getConfig, setLogout, setBalance]); // KOREKSI: Tambahkan getConfig sebagai dependency

  const handlePayment = async () => {
    if (!selectedService) {
      toast.warn('Silakan pilih layanan yang ingin dibayar.');
      return;
    }

    if (balance === null || balance < selectedService.service_tariff) { // Pastikan balance tidak null
      toast.error('Saldo tidak mencukupi untuk melakukan pembayaran ini.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/transaction`,
        {
          service_code: selectedService.service_code,
        },
        getConfig()
      );

      if (response.data.status === 0) {
        toast.success(response.data.message || `Pembayaran ${selectedService.service_name} berhasil!`);
        dispatch(setBalance(response.data.data.balance)); // Update saldo terbaru di Redux
        setSelectedService(null); // Reset pilihan layanan
      } else {
        toast.error(response.data.message || 'Pembayaran gagal. Silakan coba lagi.');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat pembayaran.';
      toast.error(errorMessage);
      console.error('Error payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (amount) => {
    if (amount === null) return 'Rp ******';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.logo}>SIMS PPOB</h1>
        <button onClick={() => navigate('/')} style={styles.backButton}>Kembali</button>
      </div>

      <div style={styles.balanceCard}>
        <p style={styles.balanceLabel}>Saldo anda</p>
        <h2 style={styles.balanceAmount}>
          {loadingBalance ? 'Memuat...' : (formatRupiah(balance))}
        </h2>
        {/* Tidak ada toggle saldo di halaman ini sesuai mock up */}
      </div>

      <h3 style={styles.paymentTitle}>Pembayaran</h3>

      {loadingServices ? (
        <p>Memuat layanan...</p>
      ) : (
        <div style={styles.servicesGrid}>
          {services.map((service) => (
            <div
              key={service.service_code}
              style={selectedService?.service_code === service.service_code ? styles.serviceItemActive : styles.serviceItem}
              onClick={() => setSelectedService(service)}
            >
              <img
                src={service.service_icon}
                alt={service.service_name}
                style={styles.serviceIcon}
                onError={(e) => { // Tambahkan onError handler untuk gambar
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/40x40/cccccc/000000?text=Icon';
                }}
              />
              <p style={styles.serviceName}>{service.service_name}</p>
            </div>
          ))}
        </div>
      )}

      {selectedService && (
        <div style={styles.selectedServiceInfo}>
          <p>Anda memilih: <strong>{selectedService.service_name}</strong></p>
          <p>Tarif: <strong>{formatRupiah(selectedService.service_tariff)}</strong></p>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={isSubmitting || !selectedService || (balance !== null && balance < selectedService?.service_tariff)} // Periksa balance tidak null
        style={
          isSubmitting || !selectedService || (balance !== null && balance < selectedService?.service_tariff)
            ? { ...styles.button, ...styles.buttonDisabled }
            : styles.button
        }
      >
        {isSubmitting ? 'Memproses Pembayaran...' : 'Bayar'}
      </button>

      {/* Dummy navigation bar */}
      <div style={styles.navBar}>
        <div style={styles.navItem} onClick={() => navigate('/')}>Home</div>
        <div style={styles.navItem} onClick={() => navigate('/topup')}>Top Up</div>
        <div style={{...styles.navItem, color: '#dc3545'}} onClick={() => navigate('/payment')}>Payment</div>
        <div style={styles.navItem} onClick={() => navigate('/history')}>History</div>
        <div style={styles.navItem} onClick={() => navigate('/profile')}>Akun</div>
      </div>
    </div>
  );
};

// Styling (tidak berubah dari sebelumnya)
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#f0f2f5',
    minHeight: '100vh',
    boxSizing: 'border-box',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  logo: {
    fontSize: '1.8em',
    color: '#dc3545',
    margin: 0,
  },
  backButton: {
    padding: '8px 15px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9em',
  },
  balanceCard: {
    backgroundColor: '#dc3545',
    color: '#fff',
    padding: '25px',
    borderRadius: '10px',
    width: '100%',
    maxWidth: 'calc(100% - 40px)',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    marginBottom: '30px',
    textAlign: 'left',
  },
  balanceLabel: {
    fontSize: '0.9em',
    margin: '0 0 5px 0',
  },
  balanceAmount: {
    fontSize: '2.5em',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
  },
  toggleBalanceButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#fff',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9em',
  },
  paymentTitle: {
    fontSize: '1.5em',
    marginBottom: '20px',
    color: '#333',
    textAlign: 'center',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
    gap: '15px',
    width: '100%',
    maxWidth: '600px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    marginBottom: '30px',
  },
  serviceItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '10px',
    cursor: 'pointer',
    border: '1px solid #eee',
    borderRadius: '8px',
    transition: 'background-color 0.2s, border-color 0.2s',
  },
  serviceItemActive: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '10px',
    cursor: 'pointer',
    border: '2px solid #dc3545',
    borderRadius: '8px',
    backgroundColor: '#ffebeb',
    transition: 'background-color 0.2s, border-color 0.2s',
  },
  serviceIcon: {
    width: '40px',
    height: '40px',
    marginBottom: '8px',
    objectFit: 'contain',
  },
  serviceName: {
    fontSize: '0.8em',
    margin: 0,
    color: '#555',
  },
  selectedServiceInfo: {
    backgroundColor: '#e9ecef',
    padding: '15px',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '400px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    maxWidth: '400px',
    padding: '12px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1.1em',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  buttonDisabled: {
    backgroundColor: '#e0e0e0',
    cursor: 'not-allowed',
  },
  navBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    backgroundColor: '#fff',
    display: 'flex',
    justifyContent: 'space-around',
    padding: '10px 0',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
    zIndex: 1000,
  },
  navItem: {
    flex: 1,
    textAlign: 'center',
    padding: '8px 0',
    cursor: 'pointer',
    color: '#555',
    fontWeight: 'bold',
    fontSize: '0.9em',
  },
};

export default PaymentPage;