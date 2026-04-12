import { useState, useEffect, useMemo } from 'react';
import { QRCode } from 'react-qr-code';

// ================= QR COMPONENT =================
function TingeeQR({ qrCode, size = 256 }) {
  if (!qrCode) return null;
  return <QRCode value={qrCode} size={size} />;
}

// ================= VIETNAM BANK LIST =================
// const VIETNAM_BANKS = [
//   { label: "Vietcombank", value: "VCB" },
//   { label: "BIDV", value: "BIDV" },
//   { label: "VietinBank", value: "VTB" },
//   { label: "Agribank", value: "AGRB" },
//   { label: "MB Bank", value: "MBB" },
//   { label: "Techcombank", value: "TCB" },
//   { label: "ACB", value: "ACB" },
//   { label: "VPBank", value: "VPB" },
//   { label: "TPBank", value: "TPB" },
//   { label: "Sacombank", value: "SCB" },
//   { label: "HDBank", value: "HB" },
//   { label: "OCB", value: "OCB" },
//   { label: "Eximbank", value: "EB" },
//   { label: "MSB", value: "MSB" },
//   { label: "SeABank", value: "SB" },
//   { label: "Nam A Bank", value: "NAB" },
//   { label: "VIB", value: "VIB" },
//   { label: "PVCombank", value: "PVB" },
// ];

// ================= CLEAN & VALIDATE =================
// function cleanSenderName(name) {
//   if (!name) return '';

//   return name
//     .normalize('NFD')
//     .replace(/[\u0300-\u036f]/g, '')
//     .replace(/[^a-zA-Z\s]/g, '')
//     .replace(/\s+/g, ' ')
//     .trim()
//     .toUpperCase();
// }

// function isValidName(name) {
//   if (!name) return false;

//   const words = name.split(' ').filter(Boolean);

//   // 2–5 từ là hợp lý
//   if (words.length < 2 || words.length > 5) return false;

//   // chặn noise spam
//   const noise = ['TEST', 'ABC', 'XYZ', 'QWE', 'ASD', 'ZXC', 'AAAA', 'BBBB'];

//   // mỗi từ hợp lệ:
//   const isValidWord = (w) => {
//     // cho phép:
//     // - 1 ký tự (A, B, C...)
//     // - hoặc >= 2 ký tự chữ
//     return /^[A-Z]$/.test(w) || /^[A-Z]{2,}$/.test(w);
//   };

//   // check word validity
//   if (!words.every(isValidWord)) return false;

//   // check noise words
//   if (words.some(w => noise.includes(w))) return false;

//   // tránh toàn chữ giống nhau (AAAA AAAA)
//   const unique = new Set(words);
//   if (unique.size === 1) return false;

//   return true;
// }

// function cleanBankAccount(acc) {
//   return acc.replace(/\D/g, '');
// }

// function isValidAccount(acc) {
//   return /^\d{6,20}$/.test(acc);
// }

// ================= APP =================
export default function App() {
  // const [senderName, setSenderName] = useState('');
  const [payment, setPayment] = useState(null);
  const [amount, setAmount] = useState('');
  const [qrUrl, setQrUrl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [expired, setExpired] = useState(false);
  const API_BASE = 'https://api.alowork.com';
  // const API_BASE = 'http://localhost:3000';
  // useEffect(() => {
  //   fetchPayments();
  // }, []);

  // const fetchPayments = async () => {
  //   try {
  //     const response = await fetch(`${API_BASE}/tingee/payments`);
  //     if (response.ok) {
  //       const data = await response.json();
  //       setHistory(data.payments);
  //     }
  //   } catch (err) {
  //     console.error('Failed to fetch payments:', err);
  //   }
  // };

  // ===== COUNTDOWN =====
  useEffect(() => {
    if (!payment?.expiredAt) return;

    setExpired(false);

    const interval = setInterval(() => {
      const now = Date.now();
      const expiredTime = new Date(payment.expiredAt).getTime();

      const diff = Math.max(0, Math.floor((expiredTime - now) / 1000));

      setTimeLeft(diff);

      if (diff <= 0) {
        setExpired(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [payment]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`${API_BASE}/local/sepay/payments`);
      const data = await res.json();

      const current = data.payments.find(p =>
        payment && p.id === payment.id
      );

      if (!current) {
        setPayment(null);
        setQrUrl(null);
        setExpired(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [payment]);

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // ================= HANDLE SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // const cleanName = cleanSenderName(senderName);
    // const cleanAcc = cleanBankAccount(bankAccount);

    // if (!isValidName(cleanName)) {
    //   alert('Tên không hợp lệ (2-5 từ, không ký tự lạ)');
    //   return;
    // }

    // if (!isValidAccount(cleanAcc)) {
    //   alert('Số tài khoản không hợp lệ');
    //   return;
    // }

    // if (!bankName) {
    //   alert('Vui lòng chọn ngân hàng');
    //   return;
    // }

    // if (!amount || Number(amount) <= 0) {
    //   alert('Số tiền không hợp lệ');
    //   return;
    // }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/local/sepay/makeQrCode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          // senderName: cleanName,
          // bankAccount: cleanAcc,
          // bankName: bankName.value // 🔥 gửi value
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || 'Lỗi khi tạo phiếu thanh toán');
      }

      const p = await response.json();
      const newPayment = p.data;


      setPayment(newPayment);
      setQrUrl(String(newPayment.qrCode));
      // setHistory([newPayment, ...history]);

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="page-shell">
      <header className="hero">
        <span className="eyebrow">
          Hệ thống tạo QR động thời gian thực chuyển khoản ngân hàng
        </span>
      </header>

      <main className="main-grid">
        <section className="card form-card">
          <div className="card-title">Tạo phiếu thanh toán</div>

          <form onSubmit={handleSubmit} className="form-grid">

            {/* <label>
              <span>Tên người chuyển (giống tên tài khoản ngân hàng)</span>
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="..."
                required
              />
            </label>

            <label>
              <span>Số tài khoản</span>
              <input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Nhập số tài khoản"
                required
              />
            </label>

            <label>
              <span>Ngân hàng</span>
              <BankDropdown
                value={bankName}
                onChange={setBankName}
              />
            </label> */}

            <label>
              <span>Số tiền</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}

              />
            </label>

            <button
              disabled={loading}
              style={{
                padding: "12px",
                borderRadius: 10,
                border: "none",
                fontWeight: 600,
                fontSize: 16,
                color: "#fff",
                background: loading
                  ? "#999"
                  : "linear-gradient(135deg, #667eea, #764ba2)",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: loading
                  ? "none"
                  : "0 6px 16px rgba(102,126,234,0.4)",
              }}
            >
              {loading ? (
                <span style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
                  <span className="spinner" />
                  Đang tạo QR...
                </span>
              ) : (
                "Tạo QR ngay"
              )}
            </button>

          </form>
        </section>

        <section className="card summary-card">
          {!payment ? (
            <div>Chưa có phiên giao dịch nào được tạo.</div>
          ) : (
            <>
              {/* <div><strong>Tên chủ tài khoản:</strong> {payment.senderName}</div>
              <div><strong>Số tài khoản:</strong> {payment.bankAccount}</div>
              <div><strong>Tên ngân hàng:</strong> {payment.bankName}</div> */}
              <div><strong>Số tiền:</strong> {payment.amount.toLocaleString()} VND</div>
              <div><strong>Mã đơn hàng:</strong> {payment.orderCode}</div>
              <div><strong>Số tài khoản:</strong> {payment.vaNumber}</div>
              <div><strong>Tên ngân hàng:</strong> {payment.bankName}</div>

              {qrUrl && <img src={qrUrl} width={200} />}

              <div style={{ marginTop: 10 }}>
                {expired ? (
                  <span style={{ color: 'red' }}>Hết hạn</span>
                ) : (
                  <span>Còn lại: {formatTime(timeLeft)}</span>
                )}
              </div>
              {/* <i
                style={{
                  color: "#d32f2f",
                  textDecoration: "underline",
                  textDecorationStyle: "dashed",
                  textUnderlineOffset: "5px",
                  lineHeight: 1.6,
                  display: "block",
                  marginTop: 10
                }}
              >
                Điền đúng một chút, an tâm cả quá trình ✨
                Check lại info trước khi chuyển để mọi thứ chạy mượt như flow,
                và tụi mình luôn ở đây nếu bạn cần hỗ trợ 💜
              </i> */}

            </>
          )}
        </section>
      </main>
    </div>
  );
}



function BankDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredBanks = useMemo(() => {
    return VIETNAM_BANKS.filter(bank =>
      bank.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div style={{ position: "relative" }}>

      {/* INPUT DISPLAY */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: 8,
          cursor: "pointer",
          background: "#fff"
        }}
      >
        {value?.label || "Chọn ngân hàng"}
      </div>

      {/* DROPDOWN */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            left: 0,
            right: 0,
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "#fff",
            zIndex: 999,
            maxHeight: 250,
            overflowY: "auto",
            boxShadow: "0 8px 20px rgba(0,0,0,0.1)"
          }}
        >

          {/* SEARCH */}
          <input
            autoFocus
            placeholder="Tìm ngân hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              border: "none",
              borderBottom: "1px solid #eee",
              outline: "none"
            }}
          />

          {/* LIST */}
          {filteredBanks.map((bank, idx) => (
            <div
              key={idx}
              onClick={() => {
                onChange(bank); // gửi cả object
                setOpen(false);
                setSearch("");
              }}
              style={{
                padding: "10px",
                cursor: "pointer",
                borderBottom: "1px solid #f5f5f5"
              }}
            >
              {bank.label}
            </div>
          ))}

          {filteredBanks.length === 0 && (
            <div style={{ padding: 10, color: "#999" }}>
              Không tìm thấy ngân hàng
            </div>
          )}

        </div>
      )}
    </div>
  );
}
