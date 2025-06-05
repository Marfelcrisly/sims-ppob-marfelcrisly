import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup'; // Corrected: * as Yup
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RegisterPage = () => {
  const navigate = useNavigate();

  // Skema validasi menggunakan Yup
  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email('Email tidak valid')
      .required('Email wajib diisi'),
    first_name: Yup.string().required('Nama Depan wajib diisi'),
    last_name: Yup.string().required('Nama Belakang wajib diisi'),
    password: Yup.string()
      .min(8, 'Password minimal 8 karakter') // Sesuai dokumentasi API
      .required('Password wajib diisi'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Konfirmasi password tidak cocok')
      .required('Konfirmasi Password wajib diisi'),
  });

  // Fungsi untuk handle submit form
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const response = await axios.post(
        'https://take-home-test-api.nutech-integrasi.com/registration', // URL API Registrasi yang benar
        {
          email: values.email,
          first_name: values.first_name,
          last_name: values.last_name,
          password: values.password,
        }
      );

      if (response.data.status === 0) { // Asumsi status 0 adalah sukses
        toast.success(response.data.message || 'Registrasi berhasil! Silakan login.');
        navigate('/login');
      } else {
        toast.error(response.data.message || 'Registrasi gagal. Silakan coba lagi.');
      }
    } catch (error) {
      // Tangani error dari API (misalnya, email sudah terdaftar)
      const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat registrasi.';
      toast.error(errorMessage);
      console.error('Error registrasi:', error);
    } finally {
      setSubmitting(false); // Selesai submit
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.logo}>SIMS PPOB</h1>
      <h2 style={styles.title}>Lengkapi data untuk membuat akun</h2>

      <Formik
        initialValues={{
          email: '',
          first_name: '',
          last_name: '',
          password: '',
          confirmPassword: '',
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
              <Field type="text" name="first_name" placeholder="Nama Depan" style={styles.input} />
              <ErrorMessage name="first_name" component="div" style={styles.error} />
            </div>

            <div style={styles.formGroup}>
              <Field type="text" name="last_name" placeholder="Nama Belakang" style={styles.input} />
              <ErrorMessage name="last_name" component="div" style={styles.error} />
            </div>

            <div style={styles.formGroup}>
              <Field type="password" name="password" placeholder="Password" style={styles.input} />
              <ErrorMessage name="password" component="div" style={styles.error} />
            </div>

            <div style={styles.formGroup}>
              <Field type="password" name="confirmPassword" placeholder="Konfirmasi Password" style={styles.input} />
              <ErrorMessage name="confirmPassword" component="div" style={styles.error} />
            </div>

            <button type="submit" disabled={isSubmitting} style={isSubmitting ? { ...styles.button, ...styles.buttonDisabled } : styles.button}>
              {isSubmitting ? 'Mendaftar...' : 'Registrasi'}
            </button>
          </Form>
        )}
      </Formik>

      <p style={styles.loginLink}>
        Sudah punya akun? <Link to="/login" style={styles.linkText}>Login di sini</Link>
      </p>
    </div>
  );
};

// Basic Styling (Anda bisa sesuaikan nanti dengan CSS modules atau styled-components)
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
    color: '#dc3545', // Warna merah cerah
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
  loginLink: {
    marginTop: '20px',
    fontSize: '0.9em',
  },
  linkText: {
    color: '#dc3545',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
};

export default RegisterPage;