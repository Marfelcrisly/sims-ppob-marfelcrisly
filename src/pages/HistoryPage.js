// src/pages/HistoryPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const HistoryPage = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const limit = 5; // Sesuai permintaan: Tampilkan 5 item
  const [hasMore, setHasMore] = useState(true); // Untuk mengontrol tombol "Show More"

  // Base URL API
  const API_BASE_URL = 'https://take-home-test-api.nutech-integrasi.com';

  // Fungsi helper untuk konfigurasi header dengan token
  const getConfig = () => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Fungsi untuk mengambil riwayat transaksi
  const fetchHistory = useCallback(async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/transaction/history?offset=${offset}&limit=${limit}`,
        getConfig()
      );

      if (response.data.status === 0) {
        const newTransactions = response.data.data.records;
        setTransactions((prevTransactions) => [...prevTransactions, ...newTransactions]);
        // Cek apakah masih ada data yang bisa dimuat
        if (newTransactions.length < limit) {
          setHasMore(false);
        }
      } else {
        toast.error(response.data.message || 'Gagal mengambil riwayat transaksi.');
        setHasMore(false); // Jika ada error, asumsikan tidak ada lagi data
      }
    } catch (err) {
      setError('Gagal memuat riwayat transaksi. Silakan coba lagi.');
      console.error('Error fetching history:', err);
      setHasMore(false);
      if (err.response && err.response.status === 401) { // Unauthorized
          toast.error('Sesi Anda berakhir. Silakan login kembali.');
          // dispatch(setLogout()); // Uncomment if you want to force logout on 401
          // navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, offset, navigate]); // Tambahkan offset sebagai dependency

  // Panggil fetchHistory saat komponen dimuat atau offset berubah
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleShowMore = () => {
    setOffset((prevOffset) => prevOffset + limit); // Tambah offset untuk memuat halaman berikutnya
  };

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

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

      <h3 style={styles.historyTitle}>Semua Transaksi</h3>

      {loading && transactions.length === 0 ? (
        <p>Memuat riwayat transaksi...</p>
      ) : transactions.length === 0 ? (
        <p>Belum ada riwayat transaksi.</p>
      ) : (
        <div style={styles.transactionList}>
          {transactions.map((transaction, index) => (
            // Untuk elemen terakhir, kita bisa menambahkan style inline secara kondisional
            // atau menggunakan CSS eksternal jika ingin mempertahankan pseudo-selector
            <div key={index} style={{
              ...styles.transactionItem,
              ...(index === transactions.length - 1 ? { borderBottom: 'none' } : {}) // KOREKSI: Terapkan style last-child secara inline
            }}>
              <div style={styles.transactionAmount}>
                <span style={{ color: transaction.transaction_type === 'TOPUP' ? '#28a745' : '#dc3545' }}>
                  {transaction.transaction_type === 'TOPUP' ? '+' : '-'} {formatRupiah(transaction.total_amount)}
                </span>
              </div>
              <div style={styles.transactionDetails}>
                <p style={styles.transactionDescription}>{transaction.description}</p>
                <p style={styles.transactionDate}>{formatDate(transaction.created_on)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && !loading && transactions.length > 0 && (
        <button onClick={handleShowMore} style={styles.showMoreButton} disabled={loading}>
          {loading ? 'Memuat...' : 'Show more'}
        </button>
      )}

      {/* Dummy navigation bar */}
      <div style={styles.navBar}>
        <div style={styles.navItem} onClick={() => navigate('/')}>Home</div>
        <div style={styles.navItem} onClick={() => navigate('/topup')}>Top Up</div>
        <div style={styles.navItem} onClick={() => navigate('/payment')}>Payment</div>
        <div style={styles.navItem} onClick={() => navigate('/history')}>History</div>
        <div style={styles.navItem} onClick={() => navigate('/profile')}>Akun</div>
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
  historyTitle: {
    fontSize: '1.5em',
    marginBottom: '20px',
    color: '#333',
    textAlign: 'center',
  },
  transactionList: {
    width: '100%',
    maxWidth: '600px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    marginBottom: '20px',
  },
  transactionItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '15px 0',
    borderBottom: '1px solid #eee',
    // KOREKSI: Hapus pseudo-selector yang tidak didukung di inline style
    // '&:last-child': {
    //   borderBottom: 'none',
    // },
  },
  transactionAmount: {
    fontSize: '1.1em',
    fontWeight: 'bold',
    minWidth: '120px', // Agar jumlah tidak terlalu mepet
  },
  transactionDetails: {
    flexGrow: 1,
    marginLeft: '15px',
    textAlign: 'right',
  },
  transactionDescription: {
    margin: 0,
    fontSize: '1em',
    color: '#333',
  },
  transactionDate: {
    margin: 0,
    fontSize: '0.8em',
    color: '#888',
  },
  showMoreButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff', // Warna biru untuk show more
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1em',
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

export default HistoryPage;