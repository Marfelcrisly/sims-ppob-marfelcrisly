import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { setBalance } from '../store/authSlice';

const nominalOptions = [10000, 20000, 50000, 100000, 250000, 500000];

const TopUpPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, balance } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Base URL API
  const API_BASE_URL = 'https://take-home-test-api.nutech-integrasi.com';

  // Fungsi helper untuk konfigurasi header dengan token
  const getConfig = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Skema validasi Formik
  const validationSchema = Yup.object().shape({
    // KOREKSI: Ubah nama field dari top_up_nominal menjadi top_up_amount
    top_up_amount: Yup.number()
      .required('Nominal Top Up wajib diisi')
      .min(10000, 'Minimum Top Up adalah Rp 10.000')
      .max(1000000, 'Maksimum Top Up adalah Rp 1.000.000')
      .integer('Nominal harus bilangan bulat'),
  });

  // Fungsi untuk mengambil saldo terbaru saat halaman dimuat
  const fetchBalance = useCallback(async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/balance`, getConfig());
      if (response.data.status === 0) {
        dispatch(setBalance(response.data.data.balance));
      } else {
        toast.error(response.data.message || 'Gagal mengambil saldo.');
      }
    } catch (err) {
      setError('Gagal memuat saldo. Silakan coba lagi.');
      console.error('Error fetching balance:', err);
      if (err.response && err.response.status === 401) {
        toast.error('Sesi Anda berakhir. Silakan login kembali.');
        // navigate('/login'); // Uncomment if you want to force logout on 401
      }
    } finally {
      setLoading(false);
    }
  }, [token, dispatch, navigate]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    // KOREKSI: Kirim top_up_amount ke API
    console.log('Nilai top_up_amount yang akan dikirim:', values.top_up_amount); // Diagnostik
    try {
      const response = await axios.post(
        `${API_BASE_URL}/topup`,
        {
          top_up_amount: values.top_up_amount, // KOREKSI: Ubah nama parameter di payload
        },
        getConfig()
      );

      if (response.data.status === 0) {
        toast.success(response.data.message || 'Top Up berhasil!');
        dispatch(setBalance(response.data.data.balance)); // Update saldo di Redux
        resetForm(); // Reset form setelah sukses
      } else {
        toast.error(response.data.message || 'Top Up gagal. Silakan coba lagi.');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat Top Up.';
      toast.error(errorMessage);
      console.error('Error Top Up:', error);
    } finally {
      setSubmitting(false);
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

  if (loading) {
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
        <button onClick={fetchBalance} style={styles.button}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.logo}>SIMS PPOB</h1>
        <button onClick={() => navigate('/')} style={styles.backButton}>Kembali</button>
      </div>

      <div style={styles.balanceCard}>
        <p style={styles.balanceLabel}>Saldo anda</p>
        <h2 style={styles.balanceAmount}>{formatRupiah(balance)}</h2>
      </div>

      <h3 style={styles.topUpTitle}>Silahkan masukkan Nominal Top Up</h3>

      <Formik
        initialValues={{ top_up_amount: null }} // KOREKSI: Ubah nama field di initialValues
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, values, isSubmitting, isValid, dirty }) => (
          <Form style={styles.form}>
            <div style={styles.nominalOptions}>
              {nominalOptions.map((nominal) => (
                <button
                  key={nominal}
                  type="button"
                  onClick={() => setFieldValue('top_up_amount', nominal)} // KOREKSI: Ubah nama field
                  style={
                    values.top_up_amount === nominal
                      ? { ...styles.nominalButton, ...styles.nominalButtonActive }
                      : styles.nominalButton
                  }
                >
                  {formatRupiah(nominal)}
                </button>
              ))}
            </div>

            <div style={styles.formGroup}>
              <Field
                type="number"
                name="top_up_amount" // KOREKSI: Ubah nama field
                placeholder="Masukkan Nominal Lain"
                style={styles.input}
                onChange={(e) => {
                  const value = e.target.value;
                  setFieldValue('top_up_amount', value === '' ? null : Number(value)); // KOREKSI: Ubah nama field
                }}
              />
              <ErrorMessage name="top_up_amount" component="div" style={styles.error} /> {/* KOREKSI: Ubah nama field */}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isValid || !dirty}
              style={isSubmitting || !isValid || !dirty ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
            >
              {isSubmitting ? 'Memproses...' : 'Top Up'}
            </button>
          </Form>
        )}
      </Formik>

      {/* Dummy navigation bar */}
      <div style={styles.navBar}>
        <div style={styles.navItem} onClick={() => navigate('/')}>Home</div>
        <div style={{...styles.navItem, color: '#dc3545'}} onClick={() => navigate('/topup')}>Top Up</div>
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
  topUpTitle: {
    fontSize: '1.5em',
    marginBottom: '20px',
    color: '#333',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: '450px',
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  nominalOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
    marginBottom: '25px',
  },
  nominalButton: {
    padding: '12px 0',
    backgroundColor: '#e9ecef',
    color: '#333',
    border: '1px solid #ced4da',
    borderRadius: '5px',
    fontSize: '1em',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease, border-color 0.3s ease',
  },
  nominalButtonActive: {
    backgroundColor: '#dc3545',
    color: '#fff',
    borderColor: '#dc3545',
  },
  formGroup: {
    marginBottom: '25px',
  },
  input: {
    width: 'calc(100% - 20px)',
    padding: '12px 10px',
    border: '1px solid #ced4da',
    borderRadius: '5px',
    fontSize: '1em',
    boxSizing: 'border-box',
    textAlign: 'center',
  },
  error: {
    color: '#dc3545',
    fontSize: '0.85em',
    marginTop: '5px',
  },
  button: {
    width: '100%',
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
    backgroundColor: '#e9ecef',
    color: '#adb5bd',
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

export default TopUpPage;