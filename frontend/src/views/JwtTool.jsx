import React, { useState, useEffect } from 'react';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { InputSwitch } from 'primereact/inputswitch';
import { useNavigate } from 'react-router-dom';
import { KJUR, KEYUTIL } from 'jsrsasign';
import CryptoJS from 'crypto-js';

// Default Keys
const defaultRSAPrivate = `-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAtzY3O3f5qX5zB5M3yP3B5d7n6qJ6y4nJ0aZ8g5zC0n2n7e6X
Y5gH6kF2B1Q8aT1M7T7zB3cT0eW6Y0xQ9U7cT5r4V3aJ2W0tG9R1uL6kP3M2aD1c
M8X4Q2sI3eG0L5aT7R0jO3yM1aW7V8cN5bL9zB3fX6cK0tI4Y9pM6qR5zC0n2n7e
6XY5gH6kF2B1Q8aT1M7T7zB3cT0eW6Y0xQ9U7cT5r4V3aJ2W0tG9R1uL6kP3M2aD
1cM8X4Q2sI3eG0L5aT7R0jO3yM1aW7V8cN5bL9zB3fX6cK0tI4Y9pM6qR5zC0n2n
7e6XY5gH6kF2B1Q8aT1M7T7zB3cT0eW6Y0xQ9U7cT5r4V3aJ2W0tG9R1uL6kP3M2
aD1cM8X4Q2sI3eG0L5aT7R0jO3yM1aW7V8cN5bL9zB3fX6cK0tI4Y9pM6qQIDAQAB
AoIBAF5Q8aT1M7T7zB3cT0eW6Y0xQ9U7cT5r4V3aJ2W0tG9R1uL6kP3M2aD1cM8X
4Q2sI3eG0L5aT7R0jO3yM1aW7V8cN5bL9zB3fX6cK0tI4Y9pM6qR5zC0n2n7e6XY
5gH6kF2B1Q8aT1M7T7zB3cT0eW6Y0xQ9U7cT5r4V3aJ2W0tG9R1uL6kP3M2aD1cM
8X4Q2sI3eG0L5aT7R0jO3yM1aW7V8cN5bL9zB3fX6cK0tI4Y9pM6qR5zC0n2n7e6
XY5gH6kF2B1Q8aT1M7T7zB3cT0eW6Y0xQ9U7cT5r4V3aJ2W0tG9R1uL6kP3M2aD1
cM8X4Q2sI3eG0L5aT7R0jO3yM1aW7V8cN5bL9zB3fX6cK0tI4Y9pM6qQKBgQDzB3c
T0eW6Y0xQ9U7cT5r4V3aJ2W0tG9R1uL6kP3M2aD1cM8X4Q2sI3eG0L5aT7R0jO3y
M1aW7V8cN5bL9zB3fX6cK0tI4Y9pM6qR5zC0n2n7e6XY5gH6kF2B1Q8aT1M7T7zB
3cT0eW6Y0xQ9U7cT5r4V3aJ2W0tG9R1uL6kP3M2aD1cM8X4Q2sI3eG0L5aT7R0jO
3yM1aW7V8cN5bL9zB3fX6cK0tI4Y9pM6qQKBgQDW6Y0xQ9U7cT5r4V3aJ2W0tG9R
1uL6kP3M2aD1cM8X4Q2sI3eG0L5aT7R0jO3yM1aW7V8cN5bL9zB3fX6cK0tI4Y9p
M6qR5zC0n2n7e6XY5gH6kF2B1Q8aT1M7T7zB3cT0eW6Y0xQ9U7cT5r4V3aJ2W0tG
9R1uL6kP3M2aD1cM8X4Q2sI3eG0L5aT7R0jO3yM1aW7V8cN5bL9zB3fX6cK0tI4Y
9pM6qQKBgQDhK0wI9X3dG1e8/sM9rL0J2O+jZ9iN2iV2E6mO9a5o2tM8tT5r/s9s
1tP3n1vQ6G2hE6qO3oG6rZ1iG1bU5sW3wW0G+e0V4dZ2rQ6tX7iN3nQ5G1zL/W+K
5lV9rI0nS2sV8H3O5jP4qM6tQ7uR3hI9oX9zO5vQ0gM2tY9rL0J2O+jZ9iN2iV2E
6mO9a5o2tM8tT5r/s9s1tP3n1vQ6G2hE6qO3oG6rZ1iG1bU5sW3wW0G+e0V4dZ2r
Q6tX7iN3nQ5G1zL/W+K5lV9rI0nS2sV8H3QKBgQC3Njc7d/mpfnMHkzfI/cHl3ufq
onrLicnRpnyDnMLSfafu7pdjmAfqQXYHVDxpPUztPvMHdxPR5bpjTFD1TtxPmvhX
donZbS0b1HW4vqQ/czZoPVwzxfhDawjd4bQvlpPtHSM7fIzVpbtXxw3lsv3MHd9f
pwrS0jhj2kzqpHnMLSfafu7pdjmAfqQXYHVDxpPUztPvMHdxPR5bpjTFD1TtxPmv
hXdonZbS0b1HW4vqQKBgQC3Njc7d/mpfnMHkzfI/cHl3ufqonrLicnRpnyDnMLSf
afu7pdjmAfqQXYHVDxpPUztPvMHdxPR5bpjTFD1TtxPmvhXdonZbS0b1HW4vqQ/c
zZoPVwzxfhDawjd4bQvlpPtHSM7fIzVpbtXxw3lsv3MHd9fpwrS0jhj2kzqpHnML
Sfafu7pdjmAfqQXYHVDxpPUztPvMHdxPR5bpjTFD1TtxPmvhXdonZbS0b1HW4v
-----END RSA PRIVATE KEY-----`;

const defaultRSAPublic = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtzY3O3f5qX5zB5M3yP3B
5d7n6qJ6y4nJ0aZ8g5zC0n2n7e6XY5gH6kF2B1Q8aT1M7T7zB3cT0eW6Y0xQ9U7c
T5r4V3aJ2W0tG9R1uL6kP3M2aD1cM8X4Q2sI3eG0L5aT7R0jO3yM1aW7V8cN5bL9
zB3fX6cK0tI4Y9pM6qR5zC0n2n7e6XY5gH6kF2B1Q8aT1M7T7zB3cT0eW6Y0xQ9U
7cT5r4V3aJ2W0tG9R1uL6kP3M2aD1cM8X4Q2sI3eG0L5aT7R0jO3yM1aW7V8cN5b
L9zB3fX6cK0tI4Y9pM6qR5zC0n2n7e6XY5gH6kF2B1Q8aT1M7T7zB3cT0eW6Y0xQ
9U7cT5r4V3aJ2W0tG9R1uL6kP3M2aD1cM8X4Q2sI3eG0L5aT7R0jO3yM1aW7V8cN
5bL9zB3fX6cK0tI4Y9pM6qQIDAQAB
-----END PUBLIC KEY-----`;

// Helper base64url utils
const toBase64Url = (str) => {
  try {
    const base64 = btoa(unescape(encodeURIComponent(str)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    return '';
  }
};

const fromBase64Url = (str) => {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(escape(atob(base64)));
  } catch (e) {
    return '';
  }
};

const algorithms = [
  { label: 'none', value: 'none' },
  { label: 'HS256', value: 'HS256' },
  { label: 'HS384', value: 'HS384' },
  { label: 'HS512', value: 'HS512' },
  { label: 'RS256', value: 'RS256' },
  { label: 'RS384', value: 'RS384' },
  { label: 'RS512', value: 'RS512' },
  { label: 'ES256', value: 'ES256' },
  { label: 'ES384', value: 'ES384' },
  { label: 'ES512', value: 'ES512' },
  { label: 'PS256', value: 'PS256' },
  { label: 'PS384', value: 'PS384' },
  { label: 'PS512', value: 'PS512' }
];

const JwtTool = () => {
  const navigate = useNavigate();
  
  const [isDecoderMode, setIsDecoderMode] = useState(false);
  const [algorithm, setAlgorithm] = useState('HS256');
  const [token, setToken] = useState('');
  
  const [headerJson, setHeaderJson] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  const [payloadJson, setPayloadJson] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
  
  const [secret, setSecret] = useState('your-256-bit-secret');
  const [secretBase64Encoded, setSecretBase64Encoded] = useState(false);
  
  const [publicKey, setPublicKey] = useState(defaultRSAPublic);
  const [privateKey, setPrivateKey] = useState(defaultRSAPrivate);
  
  const [isSignatureValid, setIsSignatureValid] = useState(true);
  const [isValidToken, setIsValidToken] = useState(true);

  const isAsymmetric = algorithm.startsWith('RS') || algorithm.startsWith('ES') || algorithm.startsWith('PS');

  // Funciones de firma y verificación adaptadas a jsrsasign
  const createSignature = (hJson, pJson, alg, sec, secB64, privKey) => {
    if (alg === 'none') return '';
    try {
      if (alg.startsWith('HS')) {
        let usedSecret = sec;
        if (secB64) {
          try { usedSecret = CryptoJS.enc.Base64.parse(sec); } catch(e){}
        }
        const hB64 = toBase64Url(hJson);
        const pB64 = toBase64Url(pJson);
        const data = hB64 + '.' + pB64;
        let hash;
        if (alg === 'HS256') hash = CryptoJS.HmacSHA256(data, usedSecret);
        if (alg === 'HS384') hash = CryptoJS.HmacSHA384(data, usedSecret);
        if (alg === 'HS512') hash = CryptoJS.HmacSHA512(data, usedSecret);
        let base64 = CryptoJS.enc.Base64.stringify(hash);
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      } else {
        const hObj = JSON.parse(hJson);
        const pObj = JSON.parse(pJson);
        const key = KEYUTIL.getKey(privKey);
        const jwt = KJUR.jws.JWS.sign(alg, JSON.stringify(hObj), JSON.stringify(pObj), key);
        return jwt.split('.')[2] || '';
      }
    } catch (err) {
      return '';
    }
  };

  const verifySignature = (jwt, alg, sec, secB64, pubKey) => {
    if (alg === 'none') {
      const parts = jwt.split('.');
      return parts.length === 3 && parts[2] === '';
    }
    try {
      if (alg.startsWith('HS')) {
        const parts = jwt.split('.');
        if (parts.length !== 3) return false;
        let usedSecret = sec;
        if (secB64) {
          try { usedSecret = CryptoJS.enc.Base64.parse(sec); } catch(e){}
        }
        const data = parts[0] + '.' + parts[1];
        let hash;
        if (alg === 'HS256') hash = CryptoJS.HmacSHA256(data, usedSecret);
        if (alg === 'HS384') hash = CryptoJS.HmacSHA384(data, usedSecret);
        if (alg === 'HS512') hash = CryptoJS.HmacSHA512(data, usedSecret);
        let expectedBase64 = CryptoJS.enc.Base64.stringify(hash).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        return expectedBase64 === parts[2];
      } else {
        const key = KEYUTIL.getKey(pubKey);
        return KJUR.jws.JWS.verifyJWT(jwt, key, { alg: [alg] });
      }
    } catch (err) {
      return false;
    }
  };

  const updateFromDecoded = (hJson, pJson, alg, sec, secB64, pubKey, privKey) => {
    const hB64 = toBase64Url(hJson);
    const pB64 = toBase64Url(pJson);
    const sigB64 = createSignature(hJson, pJson, alg, sec, secB64, privKey);
    const newToken = alg === 'none' ? hB64 + '.' + pB64 + '.' : hB64 + '.' + pB64 + '.' + sigB64;
    setToken(newToken);
    setIsValidToken(true);
    setIsSignatureValid(sigB64 !== '' || alg === 'none');
  };

  // Inicializar encoder con valores por defecto
  useEffect(() => {
    updateFromDecoded(headerJson, payloadJson, algorithm, secret, secretBase64Encoded, publicKey, privateKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algorithm]);

  const handleAlgorithmChange = (newAlg) => {
    setAlgorithm(newAlg);
    try {
      const hObj = JSON.parse(headerJson);
      hObj.alg = newAlg;
      setHeaderJson(JSON.stringify(hObj, null, 2));
    } catch (e) {}
  };

  const handleTokenChange = (e) => {
    const newToken = e.target.value;
    setToken(newToken);
    
    const parts = newToken.split('.');
    if (parts.length >= 2) {
      const hStr = fromBase64Url(parts[0]);
      const pStr = fromBase64Url(parts[1]);
      
      let currentAlg = algorithm;
      try {
        const hObj = JSON.parse(hStr);
        setHeaderJson(JSON.stringify(hObj, null, 2));
        if (hObj.alg && hObj.alg !== currentAlg && algorithms.some(a => a.value === hObj.alg)) {
          currentAlg = hObj.alg;
          setAlgorithm(currentAlg);
        }
      } catch (err) {
        setHeaderJson(hStr);
      }
      
      try {
        const pObj = JSON.parse(pStr);
        setPayloadJson(JSON.stringify(pObj, null, 2));
      } catch (err) {
        setPayloadJson(pStr);
      }

      setIsValidToken(true);

      if (parts.length === 3) {
        setIsSignatureValid(verifySignature(newToken, currentAlg, secret, secretBase64Encoded, publicKey));
      } else {
        setIsSignatureValid(false);
      }
    } else {
      setIsValidToken(false);
    }
  };

  const handleDecodedChange = (type, value) => {
    let newH = headerJson, newP = payloadJson, newSec = secret, newSecB64 = secretBase64Encoded;
    let newPub = publicKey, newPriv = privateKey;

    if (type === 'header') { newH = value; setHeaderJson(value); }
    if (type === 'payload') { newP = value; setPayloadJson(value); }
    if (type === 'secret') { newSec = value; setSecret(value); }
    if (type === 'secretBase64Encoded') { newSecB64 = value; setSecretBase64Encoded(value); }
    if (type === 'publicKey') { newPub = value; setPublicKey(value); }
    if (type === 'privateKey') { newPriv = value; setPrivateKey(value); }

    updateFromDecoded(newH, newP, algorithm, newSec, newSecB64, newPub, newPriv);
  };

  // Render text colorizado para el JWT (usado en el decodificador)
  const renderColoredToken = () => {
    const parts = token.split('.');
    if (parts.length === 0) return null;
    
    return (
      <div className="p-inputtext p-component font-code text-xl line-height-3 p-4 w-full" style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap', height: 'auto', minHeight: '150px' }}>
        {parts[0] && <span style={{ color: '#fb015b' }}>{parts[0]}</span>}
        {parts.length > 1 && <span style={{ color: '#000' }}>.</span>}
        {parts[1] && <span style={{ color: '#d63aff' }}>{parts[1]}</span>}
        {parts.length > 2 && <span style={{ color: '#000' }}>.</span>}
        {parts[2] && <span style={{ color: '#00b9f1' }}>{parts[2]}</span>}
      </div>
    );
  };

  const renderSignatureConfig = (isDecoder = false) => {
    return (
      <div className="p-inputtext p-component flex flex-column p-4 font-code mt-2 w-full" style={{ height: 'auto' }}>
        <div style={{ color: '#00b9f1' }}>
          {algorithm.startsWith('HS') ? `HMAC${algorithm.substring(2)}(` : `${algorithm}(`}
          <br />
          <span className="pl-3">base64UrlEncode(header) + "." +</span>
          <br />
          <span className="pl-3">base64UrlEncode(payload),</span>
          <br />
          
          {!isAsymmetric ? (
            <div className="pl-3 mt-3 mb-2">
              <InputText 
                value={secret} 
                onChange={(e) => handleDecodedChange('secret', e.target.value)}
                placeholder="your-256-bit-secret"
                className="w-full font-code"
              />
              <div className="flex align-items-center mt-3">
                <Checkbox 
                  inputId="b64cb" 
                  checked={secretBase64Encoded} 
                  onChange={(e) => handleDecodedChange('secretBase64Encoded', e.checked)} 
                />
                <label htmlFor="b64cb" className="ml-2 text-sm text-color-secondary">secret base64 encoded</label>
              </div>
            </div>
          ) : (
            <div className="pl-3 mt-3 mb-2 w-full">
              <div className="mb-3">
                <label className="block mb-2 text-sm text-color-secondary font-bold">Public Key (Verification)</label>
                <InputTextarea 
                  value={publicKey}
                  onChange={(e) => handleDecodedChange('publicKey', e.target.value)}
                  rows={4}
                  className="w-full font-code text-sm"
                  spellCheck="false"
                />
              </div>
              {!isDecoder && (
                <div>
                  <label className="block mb-2 text-sm text-color-secondary font-bold">Private Key (Signature)</label>
                  <InputTextarea 
                    value={privateKey}
                    onChange={(e) => handleDecodedChange('privateKey', e.target.value)}
                    rows={4}
                    className="w-full font-code text-sm"
                    spellCheck="false"
                  />
                </div>
              )}
            </div>
          )}
          )
        </div>
      </div>
    );
  };

  return (
    <div className="flex justify-content-center p-4">
      <div className="surface-card p-5 shadow-3 border-round w-full max-w-7xl">
        <div className="flex align-items-center mb-4">
          <Button icon="pi pi-arrow-left" text rounded severity="secondary" onClick={() => navigate('/')} className="mr-3" />
          <h2 className="m-0 text-3xl font-bold flex align-items-center">
            <i className="pi pi-shield mr-3 text-pink-500" style={{ fontSize: '2rem' }}></i>
            JWT Encoder / Decoder
          </h2>
        </div>

        <div className="flex flex-column md:flex-row md:align-items-center justify-content-between mb-5 border-bottom-1 surface-border pb-4">
          <p className="text-color-secondary m-0 mb-3 md:mb-0">
            Decodifica, verifica y genera JSON Web Tokens. Selecciona el algoritmo y provee tus llaves.
          </p>
          <div className="flex align-items-center">
            <span className={`font-bold mr-3 ${!isDecoderMode ? 'text-pink-500' : 'text-color-secondary'}`}>Encoder</span>
            <InputSwitch checked={isDecoderMode} onChange={(e) => setIsDecoderMode(e.value)} />
            <span className={`font-bold ml-3 ${isDecoderMode ? 'text-pink-500' : 'text-color-secondary'}`}>Decoder</span>
          </div>
        </div>

        {isDecoderMode ? (
          /* DECODER MODE */
          <div className="grid mt-3">
            <div className="col-12 lg:col-6 flex flex-column mb-4 lg:mb-0">
              <div className="flex justify-content-between align-items-center mb-3">
                <h3 className="m-0 text-xl font-semibold">Encoded Token (Paste here)</h3>
              </div>
              <InputTextarea 
                value={token} 
                onChange={handleTokenChange}
                className={`w-full p-3 font-code text-xl font-bold mb-4 ${!isValidToken ? 'p-invalid' : ''}`}
                style={{ minHeight: '150px', wordBreak: 'break-all' }}
                spellCheck="false"
                placeholder="Paste your JWT here..."
              />
              {!isValidToken && <small className="p-error mb-4">Invalid JWT format</small>}
              
              <h3 className="m-0 text-xl font-semibold mb-3">Colorized Token</h3>
              {renderColoredToken()}
            </div>

            <div className="col-12 lg:col-6 flex flex-column">
              <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-3 gap-2 md:gap-0">
                <h3 className="m-0 text-xl font-semibold">Decoded Data</h3>
                <div className="flex align-items-center">
                  <span className="font-medium mr-2">Algorithm detected:</span>
                  <span className="font-bold text-pink-500">{algorithm}</span>
                </div>
              </div>
              
              <div className="flex flex-column gap-4 flex-grow-1">
                <div className="flex flex-column">
                  <div className="font-medium mb-2 uppercase text-sm tracking-wide" style={{ color: '#fb015b' }}>Header</div>
                  <InputTextarea value={headerJson} readOnly className="font-code w-full mt-2" rows={5} autoResize />
                </div>
                <div className="flex flex-column">
                  <div className="font-medium mb-2 uppercase text-sm tracking-wide" style={{ color: '#d63aff' }}>Payload</div>
                  <InputTextarea value={payloadJson} readOnly className="font-code w-full mt-2" rows={8} autoResize />
                </div>
                <div className="flex flex-column">
                  <div className="font-medium mb-2 uppercase text-sm tracking-wide flex justify-content-between" style={{ color: '#00b9f1' }}>
                    <span>Verify Signature</span>
                    {algorithm !== 'none' ? (
                      isSignatureValid ? (
                        <span className="text-green-500"><i className="pi pi-check-circle mr-1"></i>Signature Verified</span>
                      ) : (
                        <span className="text-red-500"><i className="pi pi-times-circle mr-1"></i>Invalid Signature</span>
                      )
                    ) : (
                      <span className="text-orange-500"><i className="pi pi-exclamation-triangle mr-1"></i>Unsecured (None)</span>
                    )}
                  </div>
                  {algorithm !== 'none' && renderSignatureConfig(true)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ENCODER MODE */
          <div className="grid mt-3">
            <div className="col-12 lg:col-6 flex flex-column mb-4 lg:mb-0">
              <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-3 gap-2 md:gap-0">
                <h3 className="m-0 text-xl font-semibold">Data to Encode</h3>
                <div className="flex align-items-center">
                  <span className="font-medium mr-2">Algorithm</span>
                  <Dropdown 
                    value={algorithm} 
                    options={algorithms} 
                    onChange={(e) => handleAlgorithmChange(e.value)} 
                    className="w-10rem font-bold" 
                  />
                </div>
              </div>
              
              <div className="flex flex-column gap-4 flex-grow-1">
                <div className="flex flex-column">
                  <div className="font-medium mb-2 uppercase text-sm tracking-wide" style={{ color: '#fb015b' }}>Header</div>
                  <InputTextarea value={headerJson} onChange={(e) => handleDecodedChange('header', e.target.value)} className="font-code w-full mt-2" rows={5} autoResize spellCheck="false" />
                </div>
                <div className="flex flex-column">
                  <div className="font-medium mb-2 uppercase text-sm tracking-wide" style={{ color: '#d63aff' }}>Payload</div>
                  <InputTextarea value={payloadJson} onChange={(e) => handleDecodedChange('payload', e.target.value)} className="font-code w-full mt-2" rows={8} autoResize spellCheck="false" />
                </div>
                <div className="flex flex-column">
                  <div className="font-medium mb-2 uppercase text-sm tracking-wide" style={{ color: '#00b9f1' }}>Sign with Key/Secret</div>
                  {algorithm !== 'none' && renderSignatureConfig(false)}
                </div>
              </div>
            </div>

            <div className="col-12 lg:col-6 flex flex-column">
              <h3 className="m-0 text-xl font-semibold mb-3">Generated Token (Copy here)</h3>
              <InputTextarea 
                value={token} 
                readOnly
                className="w-full p-3 font-code text-xl font-bold"
                style={{ minHeight: '150px', wordBreak: 'break-all' }}
              />
              
              <h3 className="m-0 text-xl font-semibold mb-3 mt-4">Colorized View</h3>
              {renderColoredToken()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JwtTool;
