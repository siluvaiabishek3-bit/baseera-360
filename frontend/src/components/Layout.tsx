import { useNavigate } from 'react-router-dom';

export function Layout(props: any) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '250px', backgroundColor: '#1e3a8a', color: 'white', padding: '20px' }}>
        <h2 style={{ marginBottom: '30px' }}>BASEERA 360</h2>
        
        <div style={{ marginBottom: '10px', cursor: 'pointer', padding: '10px', borderRadius: '5px' }} onClick={() => navigate('/dashboard')}>
          Dashboard
        </div>
        
        <div style={{ marginBottom: '10px', cursor: 'pointer', padding: '10px', borderRadius: '5px' }} onClick={() => navigate('/projects')}>
          Projects
        </div>
        
        <div style={{ marginBottom: '10px', cursor: 'pointer', padding: '10px', borderRadius: '5px' }} onClick={() => navigate('/analytics')}>
          Analytics
        </div>
        
        <div style={{ marginTop: 'auto', cursor: 'pointer', padding: '10px' }} onClick={handleLogout}>
          Logout
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {props.children}
      </div>
    </div>
  );
}

export default Layout;