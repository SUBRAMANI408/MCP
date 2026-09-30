import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import toast from 'react-hot-toast';

export default function ManageAssociations() {
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [createNewHead, setCreateNewHead] = useState(true);
  const [headUserId, setHeadUserId] = useState('');
  const [headName, setHeadName] = useState('');
  const [headEmail, setHeadEmail] = useState('');
  const [headPassword, setHeadPassword] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    loadAssociations();
  }, []);

  const loadAssociations = () => {
    adminApi.getAssociations()
      .then(res => setAssociations(res.data.data))
      .catch(() => toast.error('Failed to load associations'))
      .finally(() => setLoading(false));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name) return toast.error('Association name is required');

    let payload = { name, address };
    if (createNewHead) {
      if (!headEmail || !headPassword) {
        return toast.error('Please enter Head Email and Password');
      }
      payload.headEmail = headEmail;
      payload.headPassword = headPassword;
      if (headName) payload.headName = headName;
    } else {
      if (!headUserId) return toast.error('Please enter Head User ID');
      payload.headUserId = headUserId;
    }

    adminApi.createAssociation(payload)
      .then(() => {
        toast.success('Association created');
        setName('');
        setHeadUserId('');
        setHeadEmail('');
        setHeadPassword('');
        setHeadName('');
        setAddress('');
        loadAssociations();
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed to create association'));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Manage Associations</h1>
          <p className="text-dark-100/60 text-sm mt-1">Configure and assign heads to sports associations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-white mb-4">Associations List</h3>
          {loading ? (
            <p className="text-dark-100/60">Loading associations...</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Head User</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {associations.map(assoc => (
                    <tr key={assoc._id}>
                      <td>{assoc.name}</td>
                      <td>{assoc.headUserId?.name || assoc.headUserId?.email || assoc.headUserId || '-'}</td>
                      <td>{assoc.address || '-'}</td>
                    </tr>
                  ))}
                  {associations.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center text-dark-100/40">No associations found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-white mb-4">Create Association</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Association Name</label>
              <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-dark-100/70">Create New Head User?</span>
              <button
                type="button"
                onClick={() => setCreateNewHead(!createNewHead)}
                className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  createNewHead ? 'bg-primary-600' : 'bg-dark-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    createNewHead ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {createNewHead ? (
              <>
                <div>
                  <label className="label">Head User Email</label>
                  <input type="email" className="input" value={headEmail} onChange={e => setHeadEmail(e.target.value)} placeholder="head@example.com" required />
                </div>
                <div>
                  <label className="label">Head User Password</label>
                  <input type="password" className="input" value={headPassword} onChange={e => setHeadPassword(e.target.value)} placeholder="Minimum 6 characters" required />
                </div>
                <div>
                  <label className="label">Head User Name (Optional)</label>
                  <input type="text" className="input" value={headName} onChange={e => setHeadName(e.target.value)} placeholder="e.g. John Doe" />
                </div>
              </>
            ) : (
              <div>
                <label className="label">Head User ID (Mongo ID)</label>
                <input type="text" className="input" value={headUserId} onChange={e => setHeadUserId(e.target.value)} placeholder="60d5ec49c6..." required />
              </div>
            )}

            <div>
              <label className="label">Address</label>
              <textarea className="input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter association address" />
            </div>

            <button type="submit" className="btn-primary w-full justify-center">Create</button>
          </form>
        </div>
      </div>
    </div>
  );
}
