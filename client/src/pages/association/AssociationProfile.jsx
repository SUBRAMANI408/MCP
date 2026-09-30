import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../app/store';
import { associationApi } from '../../api/associationApi';
import toast from 'react-hot-toast';

export default function AssociationProfile() {
  const { user } = useAuthStore();
  const [association, setAssociation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');

  useEffect(() => {
    if (user?.associationId) {
      loadAssociationDetails();
    }
  }, [user]);

  const loadAssociationDetails = () => {
    setLoading(true);
    associationApi.getAssociation(user.associationId)
      .then(res => {
        const assoc = res.data.data;
        setAssociation(assoc);
        setName(assoc.name || '');
        setAddress(assoc.address || '');
        setLogo(assoc.logo || '');
        setDescription(assoc.description || '');
        setPhone(assoc.contactInfo?.phone || '');
        setEmail(assoc.contactInfo?.email || '');
        setFacebookUrl(assoc.socialLinks?.facebook || '');
        setTwitterUrl(assoc.socialLinks?.twitter || '');
        setInstagramUrl(assoc.socialLinks?.instagram || '');
      })
      .catch(() => toast.error('Failed to load association details'))
      .finally(() => setLoading(false));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    setUpdating(true);

    const payload = {
      name,
      address,
      logo,
      description,
      contactInfo: {
        phone,
        email
      },
      socialLinks: {
        facebook: facebookUrl,
        twitter: twitterUrl,
        instagram: instagramUrl
      }
    };

    associationApi.updateAssociation(user.associationId, payload)
      .then(() => {
        toast.success('Association profile updated successfully');
        loadAssociationDetails();
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed to update profile'))
      .finally(() => setUpdating(false));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Association Profile</h1>
          <p className="text-dark-100/60 text-sm mt-1">Configure association metadata, contact points, logo brand assets, and social profiles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card & Stats */}
        <div className="card space-y-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-sport-500 to-primary-500 flex items-center justify-center overflow-hidden">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white">{name[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{name}</h3>
            <p className="text-xs text-dark-100/40 mt-1">{address || 'No location configured'}</p>
          </div>

          <div className="w-full border-t border-dark-700/50 pt-4 text-left space-y-2">
            <h4 className="text-xs font-bold text-dark-100/50 uppercase tracking-wider">Contact points</h4>
            <div className="text-xs text-dark-100/70">Phone: <span className="text-white font-medium">{phone || 'Not set'}</span></div>
            <div className="text-xs text-dark-100/70">Email: <span className="text-white font-medium">{email || 'Not set'}</span></div>
          </div>
        </div>

        {/* Edit profile form */}
        <div className="card lg:col-span-2">
          <form onSubmit={handleUpdate} className="space-y-4">
            <h3 className="font-semibold text-white mb-2">Edit Association Profile</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Association Name</label>
                <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Logo URL</label>
                <input type="text" className="input" placeholder="https://example.com/logo.png" value={logo} onChange={e => setLogo(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Location Address</label>
              <input type="text" className="input" value={address} onChange={e => setAddress(e.target.value)} />
            </div>

            <div>
              <label className="label">Description / Guidelines</label>
              <textarea className="input min-h-[80px]" placeholder="Add description details for participants..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <h4 className="text-xs font-bold text-dark-100/50 uppercase tracking-wider pt-2 border-t border-dark-700/50">Contact Points</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Contact Phone</label>
                <input type="text" className="input" placeholder="+92-..." value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="label">Contact Email</label>
                <input type="email" className="input" placeholder="info@association.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <h4 className="text-xs font-bold text-dark-100/50 uppercase tracking-wider pt-2 border-t border-dark-700/50">Social media links</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Facebook Link</label>
                <input type="text" className="input text-xs" placeholder="https://facebook.com/..." value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} />
              </div>
              <div>
                <label className="label">Twitter Link</label>
                <input type="text" className="input text-xs" placeholder="https://twitter.com/..." value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)} />
              </div>
              <div>
                <label className="label">Instagram Link</label>
                <input type="text" className="input text-xs" placeholder="https://instagram.com/..." value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} />
              </div>
            </div>

            <button type="submit" disabled={updating} className="btn-primary w-full justify-center mt-6">
              {updating ? 'Saving Profile Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
