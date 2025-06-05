import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setLogout, setUser, setBalance } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Definisikan default image jika belum ada profile picture
const DEFAULT_PROFILE_IMAGE = '/assets/Profile Photo.png';

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, user, balance } = useSelector((state) => state.auth);
  const [showBalance, setShowBalance] = useState(false);
  const [services, setServices] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Base URL API (tetap sama)
  const API_BASE_URL = 'https://take-home-test-api.nutech-integrasi.com';

  // Fungsi helper untuk konfigurasi header dengan token
  const getConfig = useCallback(() => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  // Fetch Profile, Balance, Services, Banners
  const fetchData = useCallback(async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Fetch Profile
      const profileResponse = await axios.get(`${API_BASE_URL}/profile`, getConfig());
      if (profileResponse.data.status === 0) {
        dispatch(setUser(profileResponse.data.data));
      } else {
        toast.error(profileResponse.data.message || 'Gagal mengambil data profil.');
      }

      // Fetch Balance
      const balanceResponse = await axios.get(`${API_BASE_URL}/balance`, getConfig());
      if (balanceResponse.data.status === 0) {
        dispatch(setBalance(balanceResponse.data.data.balance));
      } else {
        toast.error(balanceResponse.data.message || 'Gagal mengambil saldo.');
      }

      // Fetch Services
      const servicesResponse = await axios.get(`${API_BASE_URL}/services`, getConfig());
      if (servicesResponse.data.status === 0) {
        setServices(servicesResponse.data.data);
      } else {
        toast.error(servicesResponse.data.message || 'Gagal mengambil daftar layanan.');
      }

      // Fetch Banners
      const bannersResponse = await axios.get(`${API_BASE_URL}/banner`, getConfig());
      if (bannersResponse.data.status === 0) {
        setBanners(bannersResponse.data.data);
      } else {
        toast.error(bannersResponse.data.message || 'Gagal mengambil banner promo.');
      }
    } catch (err) {
      setError('Gagal memuat data. Silakan coba lagi.');
      console.error('Error fetching data:', err);
      if (err.response && err.response.status === 401) {
        toast.error('Sesi Anda berakhir. Silakan login kembali.');
        dispatch(setLogout());
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate, dispatch, getConfig]); // KOREKSI: Hapus setBalance, setLogout, setUser dari dependencies

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    dispatch(setLogout());
    toast.success('Berhasil logout!');
    navigate('/login');
  };

  const formatRupiah = (amount) => {
    if (amount === null) return 'Rp ******';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && (!user || balance === null)) {
    return (
      <div style={styles.container}>
        <p>Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={fetchData} style={styles.button}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.logo}>SIMS PPOB</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </div>

      <div style={styles.profileSection}>
        <div style={styles.profileImageContainer} onClick={() => navigate('/profile')}>
          <img
            src={user?.profile_image ? user.profile_image : DEFAULT_PROFILE_IMAGE}
            alt="Profile"
            style={styles.profileImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_PROFILE_IMAGE;
            }}
          />
          <p style={styles.welcomeText}>Selamat datang,</p>
          <p style={styles.userName}>{user?.first_name} {user?.last_name}</p>
        </div>
      </div>

      <div style={styles.balanceCard}>
        <p style={styles.balanceLabel}>Saldo anda</p>
        <h2 style={styles.balanceAmount}>
          {showBalance ? formatRupiah(balance) : 'Rp *******'}
        </h2>
        <button onClick={() => setShowBalance(!showBalance)} style={styles.toggleBalanceButton}>
          {showBalance ? 'Tutup Saldo' : 'Lihat Saldo'}
        </button>
      </div>

      <div style={styles.servicesGrid}>
        {services.map((service) => (
          <div
            key={service.service_code}
            style={styles.serviceItem}
            onClick={() => navigate(`/payment?service_code=${service.service_code}&service_name=${service.service_name}&service_tariff=${service.service_tariff}`)}
          >
            <img
              src={service.service_icon}
              alt={service.service_name}
              style={styles.serviceIcon}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/40x40/cccccc/000000?text=Icon';
              }}
            />
            <p style={styles.serviceName}>{service.service_name}</p>
          </div>
        ))}
      </div>

      <h3 style={styles.promoTitle}>Temukan promo menarik</h3>
      <div style={styles.bannerSlider}>
        {banners.map((banner) => (
          <img
            key={banner.banner_name}
            src={banner.banner_image}
            alt={banner.banner_name}
            style={styles.bannerImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/280x150/cccccc/000000?text=Banner';
            }}
          />
        ))}
      </div>

      {/* Dummy navigation bar */}
      <div style={styles.navBar}>
        <div style={{...styles.navItem, color: '#dc3545'}} onClick={() => navigate('/')}>Home</div>
        <div style={styles.navItem} onClick={() => navigate('/topup')}>Top Up</div>
        <div style={styles.navItem} onClick={() => navigate('/payment')}>Payment</div>
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
  logoutButton: {
    padding: '8px 15px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9em',
  },
  profileSection: {
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '20px',
  },
  profileImageContainer: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  profileImage: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #dc3545',
    marginRight: '10px',
  },
  welcomeText: {
    margin: 0,
    fontSize: '0.9em',
    color: '#555',
  },
  userName: {
    margin: 0,
    fontSize: '1.2em',
    fontWeight: 'bold',
    color: '#333',
    marginLeft: '5px',
  },
  balanceCard: {
    width: '100%',
    maxWidth: '450px',
    backgroundColor: '#dc3545',
    borderRadius: '8px',
    padding: '25px',
    color: '#fff',
    textAlign: 'center',
    marginBottom: '30px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  balanceLabel: {
    margin: 0,
    fontSize: '1em',
    opacity: 0.8,
  },
  balanceAmount: {
    margin: '10px 0',
    fontSize: '2.5em',
    fontWeight: 'bold',
  },
  toggleBalanceButton: {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.7)',
    color: '#fff',
    padding: '8px 15px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.9em',
    marginTop: '10px',
  },
  servicesGrid: {
    width: '100%',
    maxWidth: '450px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
  },
  serviceItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    cursor: 'pointer',
    padding: '10px',
    borderRadius: '5px',
    transition: 'background-color 0.2s ease',
  },
  serviceIcon: {
    width: '40px',
    height: '40px',
    marginBottom: '5px',
  },
  serviceName: {
    margin: 0,
    fontSize: '0.8em',
    color: '#555',
    fontWeight: 'bold',
  },
  promoTitle: {
    fontSize: '1.3em',
    marginBottom: '15px',
    color: '#333',
    width: '100%',
    maxWidth: '450px',
    textAlign: 'left',
  },
  bannerSlider: {
    width: '100%',
    maxWidth: '450px',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    marginBottom: '80px', // Ruang untuk nav bar bawah
    paddingBottom: '10px', // Ruang agar scrollbar tidak menutupi gambar
    '-webkit-overflow-scrolling': 'touch', // Untuk smooth scrolling di iOS
    scrollbarWidth: 'none', // Sembunyikan scrollbar untuk Firefox
    '-ms-overflow-style': 'none', // Sembunyikan scrollbar untuk IE/Edge
  },
  'bannerSlider::-webkit-scrollbar': { // Sembunyikan scrollbar untuk Chrome/Safari
    display: 'none',
  },
  bannerImage: {
    width: 'auto', // Lebar otomatis sesuai aspek rasio
    height: '120px', // Tinggi tetap
    borderRadius: '8px',
    marginRight: '15px',
    display: 'inline-block',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
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

export default HomePage;