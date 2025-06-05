import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { useSelector, useDispatch } from 'react-redux';
import { setUser, setLogout } from '../store/authSlice'; // Import setLogout jika belum
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Definisikan default image jika belum ada profile picture
const DEFAULT_PROFILE_IMAGE = '/assets/Profile Photo.png';

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Base URL API
  const API_BASE_URL = 'https://take-home-test-api.nutech-integrasi.com';

  // Fungsi helper untuk konfigurasi header dengan token
  // Membungkus getConfig dalam useCallback untuk memoization
  const getConfig = useCallback((contentType = 'application/json') => ({
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
    },
  }), [token]); // token adalah satu-satunya dependency yang berubah

  // Skema validasi untuk update profil
  const validationSchema = Yup.object().shape({
    first_name: Yup.string().required('Nama Depan wajib diisi'),
    last_name: Yup.string().required('Nama Belakang wajib diisi'),
  });

  // Fungsi untuk mengambil data profil (jika belum ada di Redux atau perlu refresh)
  // Membungkus fetchProfile dalam useCallback
  const fetchProfile = useCallback(async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/profile`, getConfig());
      if (response.data.status === 0) {
        dispatch(setUser(response.data.data));
        if (response.data.data.profile_image) {
          setImagePreview(response.data.data.profile_image);
        } else {
          setImagePreview(DEFAULT_PROFILE_IMAGE);
        }
      } else {
        toast.error(response.data.message || 'Gagal mengambil data profil.');
      }
    } catch (err) {
      setError('Gagal memuat data profil. Silakan coba refresh.');
      console.error('Error fetching profile:', err);
      if (err.response && err.response.status === 401) {
        toast.error('Sesi Anda berakhir. Silakan login kembali.');
        dispatch(setLogout()); // Tambahkan dispatch logout jika token tidak valid
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate, dispatch, getConfig]); // Tambahkan semua dependencies

  useEffect(() => {
    // Jika user data sudah ada dari Redux, gunakan itu
    if (user && user.email) { // Pastikan user tidak null dan punya email
      setLoading(false);
      if (user.profile_image) {
        setImagePreview(user.profile_image);
      } else {
        setImagePreview(DEFAULT_PROFILE_IMAGE);
      }
    } else {
      // Jika belum ada, fetch dari API
      fetchProfile();
    }
  }, [user, fetchProfile]); // user dan fetchProfile adalah dependencies

  // Handler untuk update data profil
  const handleUpdateProfile = async (values, { setSubmitting }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/profile/update`,
        {
          first_name: values.first_name,
          last_name: values.last_name,
        },
        getConfig()
      );

      if (response.data.status === 0) {
        toast.success(response.data.message || 'Profil berhasil diperbarui!');
        dispatch(setUser(response.data.data)); // Update user di Redux
        setIsEditing(false); // Keluar dari mode edit
      } else {
        toast.error(response.data.message || 'Gagal memperbarui profil. Silakan coba lagi.');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat memperbarui profil.';
      toast.error(errorMessage);
      console.error('Error updating profile:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handler untuk memilih file gambar
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validasi ukuran file (maksimum 100 KB)
      if (file.size > 100 * 1024) { // 100 KB dalam bytes
        toast.error('Ukuran gambar maksimum 100 KB.');
        setSelectedFile(null);
        setImagePreview(user?.profile_image ? user.profile_image : DEFAULT_PROFILE_IMAGE);
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file)); // Tampilkan preview gambar yang dipilih
    }
  };

  // Handler untuk upload gambar profil
  const handleUploadImage = async () => {
    if (!selectedFile) {
      toast.warn('Silakan pilih gambar untuk diunggah.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile); // 'file' adalah nama field yang diharapkan API

    try {
      const response = await axios.put(
        `${API_BASE_URL}/profile/image`,
        formData,
        getConfig('multipart/form-data') // Penting: Content-Type untuk upload file
      );

      if (response.data.status === 0) {
        toast.success(response.data.message || 'Gambar profil berhasil diunggah!');
        dispatch(setUser(response.data.data)); // Update user di Redux dengan URL gambar baru
        setImagePreview(response.data.data.profile_image); // Set preview ke gambar baru dari API
        setSelectedFile(null); // Reset selected file
      } else {
        toast.error(response.data.message || 'Gagal mengunggah gambar. Silakan coba lagi.');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat mengunggah gambar.';
      toast.error(errorMessage);
      console.error('Error uploading image:', error);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Memuat data profil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => window.location.reload()} style={styles.button}>
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

      <h3 style={styles.profileTitle}>Profil Saya</h3>

      <div style={styles.profileSection}>
        <div style={styles.profileImageContainer}>
          <img
            src={imagePreview || DEFAULT_PROFILE_IMAGE}
            alt="Profile"
            style={styles.profileImage}
            onError={(e) => { // Tambahkan onError handler untuk gambar
              e.target.onerror = null;
              e.target.src = DEFAULT_PROFILE_IMAGE;
            }}
          />
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="profileImageInput"
          />
          <label htmlFor="profileImageInput" style={styles.uploadButton}>
            Pilih Gambar
          </label>
          {selectedFile && (
            <button onClick={handleUploadImage} style={styles.uploadConfirmButton}>
              Upload Gambar
            </button>
          )}
        </div>

        {!isEditing ? (
          <div style={styles.profileInfo}>
            <p>Email: <strong>{user?.email}</strong></p>
            <p>Nama Depan: <strong>{user?.first_name}</strong></p>
            <p>Nama Belakang: <strong>{user?.last_name}</strong></p>
            <button onClick={() => setIsEditing(true)} style={styles.editButton}>
              Edit Profile
            </button>
          </div>
        ) : (
          <Formik
            initialValues={{
              first_name: user?.first_name || '',
              last_name: user?.last_name || '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleUpdateProfile}
            enableReinitialize={true}
          >
            {({ isSubmitting, resetForm }) => (
              <Form style={styles.editForm}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email:</label>
                  <Field type="email" name="email" value={user?.email || ''} disabled style={styles.inputDisabled} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nama Depan:</label>
                  <Field type="text" name="first_name" style={styles.input} />
                  <ErrorMessage name="first_name" component="div" style={styles.error} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nama Belakang:</label>
                  <Field type="text" name="last_name" style={styles.input} />
                  <ErrorMessage name="last_name" component="div" style={styles.error} />
                </div>
                <div style={styles.buttonGroup}>
                  <button type="submit" disabled={isSubmitting} style={styles.saveButton}>
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      resetForm();
                    }}
                    style={styles.cancelButton}
                  >
                    Batalkan
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </div>

      {/* Dummy navigation bar */}
      <div style={styles.navBar}>
        <div style={styles.navItem} onClick={() => navigate('/')}>Home</div>
        <div style={styles.navItem} onClick={() => navigate('/topup')}>Top Up</div>
        <div style={styles.navItem} onClick={() => navigate('/payment')}>Payment</div>
        <div style={styles.navItem} onClick={() => navigate('/history')}>History</div>
        <div style={{...styles.navItem, color: '#dc3545'}} onClick={() => navigate('/profile')}>Akun</div>
      </div>
    </div>
  );
};

// Styling
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
  profileTitle: {
    fontSize: '1.5em',
    marginBottom: '20px',
    color: '#333',
    textAlign: 'center',
  },
  profileSection: {
    width: '100%',
    maxWidth: '450px',
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  profileImage: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #dc3545',
    marginBottom: '10px',
  },
  uploadButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9em',
    marginBottom: '10px',
    textAlign: 'center',
  },
  uploadConfirmButton: {
    backgroundColor: '#28a745', // Green for confirm upload
    color: '#fff',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9em',
    border: 'none',
    marginTop: '5px',
  },
  profileInfo: {
    width: '100%',
    textAlign: 'left',
  },
  editButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1em',
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'background-color 0.3s ease',
  },
  editForm: {
    width: '100%',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    width: 'calc(100% - 20px)',
    padding: '10px',
    border: '1px solid #ced4da',
    borderRadius: '5px',
    fontSize: '1em',
    boxSizing: 'border-box',
  },
  inputDisabled: {
    width: 'calc(100% - 20px)',
    padding: '10px',
    border: '1px solid #e9ecef',
    borderRadius: '5px',
    fontSize: '1em',
    boxSizing: 'border-box',
    backgroundColor: '#e9ecef',
    color: '#6c757d',
  },
  error: {
    color: '#dc3545',
    fontSize: '0.85em',
    marginTop: '5px',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px',
  },
  saveButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#28a745', // Green for save
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1em',
    cursor: 'pointer',
    marginRight: '10px',
    transition: 'background-color 0.3s ease',
  },
  cancelButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#ffc107', // Yellow for cancel
    color: '#333',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1em',
    cursor: 'pointer',
    marginLeft: '10px',
    transition: 'background-color 0.3s ease',
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

export default ProfilePage;