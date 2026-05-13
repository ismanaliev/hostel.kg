import React, { useState, useEffect } from 'react';

const API_URL = '/api/users';

function BecomeOwnerStepper({ token, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    hostel_name: '',
    hostel_category: 'Mixed',
    address: '',
    latitude: null,
    longitude: null,
    hostel_description: '',
    contact_phone: '',
    entrance_image: null,
    dorm_image: null,
    common_area_image: null,
  });

  const categories = ['Male-only', 'Female-only', 'Mixed', 'LGBTQ+ Friendly'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (fieldName, file) => {
    setFormData((prev) => ({ ...prev, [fieldName]: file }));
  };

  const handleLocationPin = async () => {
    setLoading(true);
    setError('');
    try {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser.');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData((prev) => ({
            ...prev,
            latitude: parseFloat(latitude.toFixed(6)),
            longitude: parseFloat(longitude.toFixed(6)),
          }));
          setLoading(false);
        },
        () => {
          setError('Unable to access your location. Please check permissions.');
          setLoading(false);
        }
      );
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const payload = new FormData();
    payload.append('hostel_name', formData.hostel_name);
    payload.append('hostel_category', formData.hostel_category);
    payload.append('address', formData.address);
    payload.append('hostel_description', formData.hostel_description);
    payload.append('contact_phone', formData.contact_phone);
    if (formData.latitude !== null) payload.append('latitude', formData.latitude);
    if (formData.longitude !== null) payload.append('longitude', formData.longitude);
    if (formData.entrance_image) payload.append('entrance_image', formData.entrance_image);
    if (formData.dorm_image) payload.append('dorm_image', formData.dorm_image);
    if (formData.common_area_image) payload.append('common_area_image', formData.common_area_image);

    try {
      const response = await fetch(`${API_URL}/become-owner/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
        body: payload,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to submit application.');
      }

      const data = await response.json();
      setSuccessMessage(data.message);
      if (onSuccess) {
        onSuccess(data);
      }
      setTimeout(() => setStep(1), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Become a Hostel Owner</h2>
      <StepIndicator currentStep={step} totalSteps={4} />

      {error && <div style={styles.error}>{error}</div>}
      {successMessage && <div style={styles.success}>{successMessage}</div>}

      {step === 1 && (
        <Step1BasicInfo
          formData={formData}
          categories={categories}
          onInputChange={handleInputChange}
        />
      )}
      {step === 2 && (
        <Step2Location
          formData={formData}
          onLocationPin={handleLocationPin}
          onInputChange={handleInputChange}
          loading={loading}
        />
      )}
      {step === 3 && (
        <Step3BusinessDetails
          formData={formData}
          onInputChange={handleInputChange}
        />
      )}
      {step === 4 && (
        <Step4Verification
          formData={formData}
          onFileChange={handleFileChange}
        />
      )}

      <div style={styles.navigation}>
        <button
          onClick={() => setStep(step - 1)}
          disabled={step === 1 || loading}
          style={styles.button}
        >
          Back
        </button>
        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={loading}
            style={styles.button}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ ...styles.button, backgroundColor: '#4CAF50' }}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((num) => (
        <div
          key={num}
          style={{
            ...styles.stepDot,
            backgroundColor: num <= currentStep ? '#2196F3' : '#e0e0e0',
            fontWeight: num <= currentStep ? 'bold' : 'normal',
            color: num <= currentStep ? 'white' : '#999',
          }}
        >
          {num}
        </div>
      ))}
    </div>
  );
}

function Step1BasicInfo({ formData, categories, onInputChange }) {
  return (
    <div style={styles.step}>
      <h3>Basic Information</h3>
      <label>
        <span>Hostel Name *</span>
        <input
          type="text"
          name="hostel_name"
          value={formData.hostel_name}
          onChange={onInputChange}
          placeholder="e.g., Sunny Beach Hostel"
          style={styles.input}
        />
      </label>
      <label>
        <span>Category *</span>
        <select
          name="hostel_category"
          value={formData.hostel_category}
          onChange={onInputChange}
          style={styles.input}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function Step2Location({ formData, onLocationPin, onInputChange, loading }) {
  return (
    <div style={styles.step}>
      <h3>Location Details</h3>
      <label>
        <span>Address *</span>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={onInputChange}
          placeholder="Street address of your hostel"
          style={styles.input}
        />
      </label>
      <button onClick={onLocationPin} disabled={loading} style={styles.geoButton}>
        {loading ? 'Getting location...' : '📍 Pin Current Location'}
      </button>
      {formData.latitude && formData.longitude && (
        <div style={styles.locationDisplay}>
          <p>Coordinates: {formData.latitude}, {formData.longitude}</p>
        </div>
      )}
    </div>
  );
}

function Step3BusinessDetails({ formData, onInputChange }) {
  return (
    <div style={styles.step}>
      <h3>Business Details</h3>
      <label>
        <span>Primary Contact Phone</span>
        <input
          type="tel"
          name="contact_phone"
          value={formData.contact_phone}
          onChange={onInputChange}
          placeholder="Your contact number"
          style={styles.input}
        />
      </label>
      <label>
        <span>Hostel Description</span>
        <textarea
          name="hostel_description"
          value={formData.hostel_description}
          onChange={onInputChange}
          placeholder="Tell us about your hostel (amenities, vibe, target guests, etc.)"
          style={{ ...styles.input, minHeight: 120 }}
        />
      </label>
    </div>
  );
}

function Step4Verification({ formData, onFileChange }) {
  const imageTypes = [
    { key: 'entrance_image', label: 'Entrance Photo *', desc: 'Clear photo of hostel entrance' },
    { key: 'dorm_image', label: 'Dorm Room Photo *', desc: 'Interior photo showing typical dorm setup' },
    { key: 'common_area_image', label: 'Common Area Photo *', desc: 'Photo of common/lounge area' },
  ];

  return (
    <div style={styles.step}>
      <h3>Photo Verification</h3>
      <p style={styles.helpText}>Please upload 3 clear photos for verification</p>
      {imageTypes.map(({ key, label, desc }) => (
        <div key={key} style={styles.photoUpload}>
          <label>
            <span>{label}</span>
            <p style={styles.photoDesc}>{desc}</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFileChange(key, e.target.files?.[0])}
              style={styles.fileInput}
            />
            {formData[key] && (
              <p style={styles.uploadedFile}>✓ {formData[key].name}</p>
            )}
          </label>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: '0 auto',
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
  },
  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 30,
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  step: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginTop: 8,
    marginBottom: 16,
    border: '1px solid #ddd',
    borderRadius: 4,
    fontSize: 14,
    fontFamily: 'inherit',
  },
  label: {
    display: 'block',
    marginBottom: 16,
  },
  geoButton: {
    width: '100%',
    padding: 12,
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    cursor: 'pointer',
    marginBottom: 16,
  },
  locationDisplay: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 4,
    color: '#2e7d32',
    fontSize: 12,
  },
  photoUpload: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 4,
    marginBottom: 12,
    border: '2px dashed #ddd',
  },
  photoDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  fileInput: {
    marginTop: 8,
    cursor: 'pointer',
  },
  uploadedFile: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 8,
  },
  navigation: {
    display: 'flex',
    gap: 12,
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 12,
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    cursor: 'pointer',
    ':disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
    },
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    fontSize: 14,
  },
  success: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    fontSize: 14,
  },
  helpText: {
    color: '#999',
    fontSize: 12,
    marginBottom: 16,
  },
};

export default BecomeOwnerStepper;
