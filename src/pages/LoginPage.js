import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup'; // Corrected: * as Yup
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setLogin } from '../store/authSlice';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Skema validasi menggunakan Yup
  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email('Email tidak valid')
      .required('Email wajib diisi'),
    password: Yup.string().required('Password wajib diisi'),
  });

  // Fungsi untuk handle submit form
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const response = await axios.post(
        'https://take-home-test-api.nutech-integrasi.com/login', // URL API Login yang benar
        {
          email: values.email,
          password: values.password,
        }
      );

      if (response.data.status === 0) { // Asumsi status 0 adalah sukses
        const token = response.data.data.token; // Dapatkan token dari respons API
        dispatch(setLogin({ token })); // Simpan token ke Redux store dan localStorage
        toast.success(response.data.message || 'Login berhasil! Selamat datang.');
        navigate('/'); // Arahkan ke halaman utama setelah login sukses
      } else {
        toast.error(response.data.message || 'Login gagal. Email atau password salah.');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat login.';
      toast.error(errorMessage);
      console.error('Error login:', error);
    } finally {
      setSubmitting(false); // Selesai submit
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.logo}>SIMS PPOB</h1>
      <h2 style={styles.title}>Masuk atau buat akun untuk memulai</h2>

      <Formik
        initialValues={{
          email: '',
          password: '',
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form style={styles.form}>
            <div style={styles.formGroup}>
              <Field type="email" name="email" placeholder="Email" style={styles.input} />
              <ErrorMessage name="email" component="div" style={styles.error} />
            </div>

            <div style={styles.formGroup}>
              <Field type="password" name="password" placeholder="Password" style={styles.input} />
              <ErrorMessage name="password" component="div" style={styles.error} />
            </div>

            <button type="submit" disabled={isSubmitting} style={isSubmitting ? { ...styles.button, ...styles.buttonDisabled } : styles.button}>
              {isSubmitting ? 'Masuk...' : 'Masuk'}
            </button>
          </Form>
        )}
      </Formik>

      <p style={styles.registerLink}>
        Belum punya akun? <Link to="/register" style={styles.linkText}>Registrasi di sini</Link>
      </p>
    </div>
  );
};

// Basic Styling (sama dengan RegisterPage untuk konsistensi)
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    padding: '20px',
    boxSizing: 'border-box',
  },
  logo: {
    fontSize: '2em',
    color: '#dc3545',
    marginBottom: '20px',
  },
  title: {
    fontSize: '1.5em',
    marginBottom: '30px',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  formGroup: {
    marginBottom: '15px',
  },
  input: {
    width: 'calc(100% - 20px)',
    padding: '10px',
    border: '1px solid #ced4da',
    borderRadius: '5px',
    fontSize: '1em',
    boxSizing: 'border-box',
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
    backgroundColor: '#e0e0e0',
    cursor: 'not-allowed',
  },
  registerLink: {
    marginTop: '20px',
    fontSize: '0.9em',
  },
  linkText: {
    color: '#dc3545',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
};

export default LoginPage;