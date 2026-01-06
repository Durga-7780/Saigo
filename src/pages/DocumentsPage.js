import {
    AccountBalance,
    Badge,
    CheckCircle,
    CloudUpload,
    Description,
    Edit,
    Lock,
    VerifiedUser,
    Visibility
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemText,
    TextField,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI, requestAPI } from '../services/api';

const DocumentsPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [aadharNumber, setAadharNumber] = useState('');
    const [uploading, setUploading] = useState(false);
    const [documents, setDocuments] = useState([]); 
    const [msg, setMsg] = useState({ type: '', content: '' });
    
    // Request Edit State
    const [requestDialogOpen, setRequestDialogOpen] = useState(false);
    const [requestReason, setRequestReason] = useState('');
    const [pendingRequest, setPendingRequest] = useState(null);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await employeeAPI.getProfile();
            setProfile(res.data);
            setAadharNumber(res.data.aadhar_number || '');
            setDocuments(res.data.documents || []);
            
            // Check for pending requests
            const reqs = await requestAPI.getAll({ status: 'pending' });
            const bankReq = (Array.isArray(reqs.data) ? reqs.data : []).find(r => r.request_type === 'bank_details_update');
            if (bankReq) setPendingRequest(bankReq);
            
        } catch (error) {
            console.error("Failed to load profile", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleAadharUpdate = async () => {
        // ... (existing logic)
        if (aadharNumber.length !== 12) {
            setMsg({ type: 'error', content: 'Aadhar number must be 12 digits' });
            return;
        }
        try {
            await employeeAPI.updateProfile({ aadhar_number: aadharNumber });
            setMsg({ type: 'success', content: 'Aadhar number updated successfully' });
            fetchProfile();
        } catch (error) {
            setMsg({ type: 'error', content: 'Failed to update Aadhar' });
        }
    };

    const handleFileUpload = (event) => {
        // ... (existing logic)
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setTimeout(async () => {
            const newDoc = {
                title: file.name,
                document_type: 'certificate',
                file_url: URL.createObjectURL(file), // Mock URL
                uploaded_at: new Date().toISOString(),
                status: 'pending'
            };
            
            const updatedDocs = [...documents, newDoc];
            try {
                await employeeAPI.updateProfile({ documents: updatedDocs });
                setDocuments(updatedDocs);
                setMsg({ type: 'success', content: 'Document uploaded successfully' });
            } catch (e) {
                setMsg({ type: 'error', content: 'Failed to save document metadata' });
            } finally {
                setUploading(false);
            }
        }, 1500);
    };

    const handleRequestEdit = async () => {
        if (!requestReason) return;
        try {
            await requestAPI.create({
                request_type: 'bank_details_update',
                reason: requestReason
            });
            setMsg({ type: 'success', content: 'Request submitted to HR successfully' });
            setRequestDialogOpen(false);
            fetchProfile(); // Refresh to see pending status
        } catch (error) {
            setMsg({ type: 'error', content: error.response?.data?.detail || 'Failed to submit request' });
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>
                My Documents & Compliance
            </Typography>

            {msg.content && (
                <Alert severity={msg.type} sx={{ mb: 3 }} onClose={() => setMsg({ type: '', content: '' })}>
                    {msg.content}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Identity Proofs */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 3, height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <VerifiedUser color="primary" />
                                <Typography variant="h6">Identity Verification</Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />

                            <Box sx={{ mb: 4 }}>
                                <Typography variant="subtitle2" gutterBottom>Aadhar Number</Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField 
                                        fullWidth 
                                        size="small" 
                                        placeholder="Enter 12-digit Aadhar"
                                        value={aadharNumber}
                                        onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                                        InputProps={{
                                            endAdornment: profile?.aadhar_number ? <CheckCircle color="success" /> : null
                                        }}
                                    />
                                    <Button 
                                        variant="contained" 
                                        disabled={!aadharNumber || aadharNumber === profile?.aadhar_number}
                                        onClick={handleAadharUpdate}
                                    >
                                        Update
                                    </Button>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    {profile?.aadhar_number ? "Verified & Linked" : "Pending Linkage"}
                                </Typography>
                            </Box>
                            
                            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>PAN Number</Typography>
                                <Typography variant="body1" fontWeight={600}>
                                    {profile?.bank_details?.pan_number || "Not Provided"}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Statutory Details */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 3, height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AccountBalance color="primary" />
                                    <Typography variant="h6">Statutory & Bank Details</Typography>
                                </Box>
                                {profile?.is_bank_details_locked ? (
                                    pendingRequest ? (
                                        <Chip label="Request Pending" color="warning" size="small" />
                                    ) : (
                                        <Button 
                                            variant="outlined" 
                                            size="small" 
                                            startIcon={<Lock />}
                                            onClick={() => setRequestDialogOpen(true)}
                                            color="warning"
                                        >
                                            Request Edit
                                        </Button>
                                    )
                                ) : (
                                    <Button 
                                        variant="contained" 
                                        size="small" 
                                        startIcon={<Edit />}
                                        onClick={() => navigate('/profile')} 
                                    >
                                        Edit Details
                                    </Button>
                                )}
                            </Box>
                            <Divider sx={{ mb: 3 }} />

                            <List>
                                <ListItem>
                                    <ListItemText secondary="Bank Account" primary={profile?.bank_details?.account_number || "N/A"} />
                                </ListItem>
                                <ListItem>
                                    <ListItemText secondary="Bank Name" primary={profile?.bank_details?.bank_name || "N/A"} />
                                </ListItem>
                                <ListItem>
                                    <ListItemText secondary="IFSC Code" primary={profile?.bank_details?.ifsc_code || "N/A"} />
                                </ListItem>
                                <ListItem>
                                    <ListItemText secondary="UAN Number (PF)" primary={profile?.bank_details?.uan_number || "N/A"} />
                                </ListItem>
                                <ListItem>
                                    <ListItemText secondary="PF Account Number" primary={profile?.bank_details?.pf_number || "N/A"} />
                                </ListItem>
                            </List>
                            
                            {!profile?.is_bank_details_locked && (
                                <Alert severity="success" sx={{ mt: 1 }}>
                                    Bank details are unlocked. You can edit them in your Profile.
                                </Alert>
                            )}
                            {profile?.is_bank_details_locked && (
                                <Alert severity="info" sx={{ mt: 1 }}>
                                    Details are locked for security. Request unlock to make changes.
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Documents Repository */}
                <Grid item xs={12}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Description color="primary" />
                                    <Typography variant="h6">My Certificates & Documents</Typography>
                                </Box>
                                <Button 
                                    component="label" 
                                    variant="outlined" 
                                    startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
                                    disabled={uploading}
                                >
                                    Upload Document
                                    <input type="file" hidden onChange={handleFileUpload} accept=".pdf,.jpg,.png" />
                                </Button>
                            </Box>
                            <Divider sx={{ mb: 3 }} />

                            {documents.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                                    <Description sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
                                    <Typography>No documents uploaded yet.</Typography>
                                </Box>
                            ) : (
                                <Grid container spacing={2}>
                                    {documents.map((doc, index) => (
                                        <Grid item xs={12} md={4} key={index}>
                                            <Card variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
                                                    <Badge color={doc.status === 'verified' ? 'success' : 'warning'} variant="dot">
                                                        <Description color="action" />
                                                    </Badge>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="subtitle2" noWrap title={doc.title}>{doc.title}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(doc.uploaded_at).toLocaleDateString()}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <IconButton size="small" href={doc.file_url} target="_blank">
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Request Dialog */}
                <Dialog open={requestDialogOpen} onClose={() => setRequestDialogOpen(false)}>
                    <DialogTitle>Request to Edit Bank Details</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Please provide a reason for updating your bank/statutory details. HR will review your request.
                        </DialogContentText>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Reason for Update"
                            fullWidth
                            variant="outlined"
                            value={requestReason}
                            onChange={(e) => setRequestReason(e.target.value)}
                            multiline
                            rows={3}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setRequestDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleRequestEdit} variant="contained">Submit Request</Button>
                    </DialogActions>
                </Dialog>
            </Grid>
        </Box>
    );
};

export default DocumentsPage;
