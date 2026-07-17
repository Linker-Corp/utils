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
(Replace with your actual private key)
-----END RSA PRIVATE KEY-----`;

const defaultRSAPublic = `-----BEGIN PUBLIC KEY-----
(Replace with your actual public key)
-----END PUBLIC KEY-----`;

// Helper base64url utils
const toBase64Url = (str) => {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCodePoint(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  } catch (e) {
    console.error('Encoding error:', e);
    return '';
  }
};

const fromBase64Url = (str) => {
  try {
    let base64 = str.replaceAll('-', '+').replaceAll('_', '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.codePointAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    console.error('Decoding error:', e);
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

  const [publicKeyFormat, setPublicKeyFormat] = useState('PEM');
  const [privateKeyFormat, setPrivateKeyFormat] = useState('PEM');

  const [isSignatureValid, setIsSignatureValid] = useState(true);
  const [isValidToken, setIsValidToken] = useState(true);

  const isAsymmetric = algorithm.startsWith('RS') || algorithm.startsWith('ES') || algorithm.startsWith('PS');

  const createHmacSignature = (hJson, pJson, alg, sec, secB64) => {
    let usedSecret = sec;
    if (secB64) {
      try { usedSecret = CryptoJS.enc.Base64.parse(sec); } catch (e) { console.error('Parse error:', e); }
    }
    const data = toBase64Url(hJson) + '.' + toBase64Url(pJson);
    let hash;
    if (alg === 'HS256') hash = CryptoJS.HmacSHA256(data, usedSecret);
    else if (alg === 'HS384') hash = CryptoJS.HmacSHA384(data, usedSecret);
    else if (alg === 'HS512') hash = CryptoJS.HmacSHA512(data, usedSecret);
    else return '';
    let base64 = CryptoJS.enc.Base64.stringify(hash);
    return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  };

  const createAsymmetricSignature = (hJson, pJson, alg, privKey) => {
    const hObj = JSON.parse(hJson);
    const pObj = JSON.parse(pJson);
    let keyInput = privKey;
    if (privKey.trim().startsWith('{')) {
      try {
        keyInput = JSON.parse(privKey);
      } catch (e) { console.error('Parse error:', e); }
    }
    const key = KEYUTIL.getKey(keyInput);
    const jwt = KJUR.jws.JWS.sign(alg, JSON.stringify(hObj), JSON.stringify(pObj), key);
    return jwt.split('.')[2] || '';
  };

  const createSignature = (hJson, pJson, alg, sec, secB64, privKey) => {
    if (alg === 'none') return '';
    try {
      if (alg.startsWith('HS')) {
        return createHmacSignature(hJson, pJson, alg, sec, secB64);
      }
      return createAsymmetricSignature(hJson, pJson, alg, privKey);
    } catch (err) {
      console.error('Signature creation error:', err);
      return '';
    }
  };

  const verifyHmacSignature = (jwt, alg, sec, secB64) => {
    const parts = jwt.split('.');
    if (parts.length !== 3) return false;
    let usedSecret = sec;
    if (secB64) {
      try { usedSecret = CryptoJS.enc.Base64.parse(sec); } catch (e) { console.error('Parse error:', e); }
    }
    const data = parts[0] + '.' + parts[1];
    let hash;
    if (alg === 'HS256') hash = CryptoJS.HmacSHA256(data, usedSecret);
    else if (alg === 'HS384') hash = CryptoJS.HmacSHA384(data, usedSecret);
    else if (alg === 'HS512') hash = CryptoJS.HmacSHA512(data, usedSecret);
    else return false;
    let expectedBase64 = CryptoJS.enc.Base64.stringify(hash).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
    return expectedBase64 === parts[2];
  };

  const verifyAsymmetricSignature = (jwt, alg, pubKey) => {
    let keyInput = pubKey;
    if (pubKey.trim().startsWith('{')) {
      try {
        keyInput = JSON.parse(pubKey);
      } catch (e) { console.error('Parse error:', e); }
    }
    const key = KEYUTIL.getKey(keyInput);
    return KJUR.jws.JWS.verify(jwt, key, [alg]);
  };

  const verifySignature = (jwt, alg, sec, secB64, pubKey) => {
    if (alg === 'none') {
      const parts = jwt.split('.');
      return parts.length === 3 && parts[2] === '';
    }
    try {
      if (alg.startsWith('HS')) {
        return verifyHmacSignature(jwt, alg, sec, secB64);
      }
      return verifyAsymmetricSignature(jwt, alg, pubKey);
    } catch (err) {
      console.error('Signature verification error:', err);
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

  const handleReset = () => {
    setIsDecoderMode(false);
    setHeaderJson('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
    setPayloadJson('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}');
    setSecret('your-256-bit-secret');
    setSecretBase64Encoded(false);
    setPublicKey(defaultRSAPublic);
    setPrivateKey(defaultRSAPrivate);
    setAlgorithm('HS256'); // This will trigger the useEffect to regenerate the token
  };

  // Inicializar encoder con valores por defecto
  useEffect(() => {
    updateFromDecoded(headerJson, payloadJson, algorithm, secret, secretBase64Encoded, publicKey, privateKey);
  }, [algorithm]);

  const handleAlgorithmChange = (newAlg) => {
    setAlgorithm(newAlg);
    try {
      const hObj = JSON.parse(headerJson);
      hObj.alg = newAlg;
      setHeaderJson(JSON.stringify(hObj, null, 2));
    } catch (e) {
      console.error('JSON parse error:', e);
    }
  };

  const applyJwk = (keys, kid, newToken, currentAlg) => {
    const key = keys.find(k => k.kid === kid);
    if (key) {
      const keyStr = JSON.stringify(key, null, 2);
      setPublicKey(keyStr);
      setPublicKeyFormat('JWK');
      setIsSignatureValid(verifySignature(newToken, currentAlg, secret, secretBase64Encoded, keyStr));
    }
  };

  const fetchJwk = async (iss, kid, newToken, currentAlg) => {
    const fetchUrl = iss.endsWith('/') ? `${iss}protocol/openid-connect/certs` : `${iss}/protocol/openid-connect/certs`;
    try {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error('Not ok');
      const data = await res.json();
      if (data?.keys) {
        applyJwk(data.keys, kid, newToken, currentAlg);
        return;
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }

    const fallbackUrl = iss.endsWith('/') ? `${iss}.well-known/jwks.json` : `${iss}/.well-known/jwks.json`;
    try {
      const res = await fetch(fallbackUrl);
      if (res.ok) {
        const data = await res.json();
        if (data?.keys) {
          applyJwk(data.keys, kid, newToken, currentAlg);
        }
      }
    } catch (e) {
      console.error('Could not auto-fetch JWK', e);
    }
  };

  const handleTokenChange = (e) => {
    const newToken = e.target.value;
    setToken(newToken);

    const parts = newToken.split('.');
    if (parts.length < 2) {
      setIsValidToken(false);
      return;
    }

    const hStr = fromBase64Url(parts[0]);
    const pStr = fromBase64Url(parts[1]);

    let currentAlg = algorithm;
    let newPubKey = publicKey;
    let hObj = null;
    let pObj = null;
    
    try {
      hObj = JSON.parse(hStr);
      setHeaderJson(JSON.stringify(hObj, null, 2));
      if (hObj.alg && hObj.alg !== currentAlg && algorithms.some(a => a.value === hObj.alg)) {
        currentAlg = hObj.alg;
        setAlgorithm(currentAlg);
      }
      
      // Auto-extract JWK if present in header
      if (hObj.jwk) {
        newPubKey = JSON.stringify(hObj.jwk, null, 2);
        setPublicKey(newPubKey);
        setPublicKeyFormat('JWK');
      }
    } catch (err) {
      console.error('Header parse error:', err);
      setHeaderJson(hStr);
    }

    try {
      pObj = JSON.parse(pStr);
      setPayloadJson(JSON.stringify(pObj, null, 2));
    } catch (err) {
      console.error('Payload parse error:', err);
      setPayloadJson(pStr);
    }

    setIsValidToken(true);

    if (parts.length === 3) {
      setIsSignatureValid(verifySignature(newToken, currentAlg, secret, secretBase64Encoded, newPubKey));
      
      // Auto-fetch JWK if kid and iss are present
      if (hObj?.kid && pObj?.iss && !hObj.jwk) {
        fetchJwk(pObj.iss, hObj.kid, newToken, currentAlg);
      }
    } else {
      setIsSignatureValid(false);
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
          <span className="pl-3">base64Encode(header) + "." +</span>
          <br />
          <span className="pl-3">base64Encode(payload),</span>
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
                <div className="flex justify-content-between align-items-center mb-2">
                  <label htmlFor="publicKeyInput" className="block text-sm text-color-secondary font-bold m-0">Public Key (Verification)</label>
                  <Dropdown
                    value={publicKeyFormat}
                    options={[{label: 'PEM', value: 'PEM'}, {label: 'JWK', value: 'JWK'}]}
                    onChange={(e) => setPublicKeyFormat(e.value)}
                    className="p-dropdown-sm"
                    style={{ height: '2.5rem', display: 'flex', alignItems: 'center' }}
                  />
                </div>
                <InputTextarea
                  id="publicKeyInput"
                  value={publicKey}
                  onChange={(e) => handleDecodedChange('publicKey', e.target.value)}
                  rows={publicKeyFormat === 'JWK' ? 8 : 4}
                  className="w-full font-code text-sm"
                  spellCheck="false"
                  placeholder={publicKeyFormat === 'JWK' ? '{\n  "kty": "RSA",\n  "e": "AQAB",\n  "n": "..."\n}' : '-----BEGIN PUBLIC KEY-----...'}
                />
              </div>
              {!isDecoder && (
                <div>
                  <div className="flex justify-content-between align-items-center mb-2">
                    <label htmlFor="privateKeyInput" className="block text-sm text-color-secondary font-bold m-0">Private Key (Signature)</label>
                    <Dropdown
                      value={privateKeyFormat}
                      options={[{label: 'PEM', value: 'PEM'}, {label: 'JWK', value: 'JWK'}]}
                      onChange={(e) => setPrivateKeyFormat(e.value)}
                      className="p-dropdown-sm"
                      style={{ height: '2.5rem', display: 'flex', alignItems: 'center' }}
                    />
                  </div>
                  <InputTextarea
                    id="privateKeyInput"
                    value={privateKey}
                    onChange={(e) => handleDecodedChange('privateKey', e.target.value)}
                    rows={privateKeyFormat === 'JWK' ? 8 : 4}
                    className="w-full font-code text-sm"
                    spellCheck="false"
                    placeholder={privateKeyFormat === 'JWK' ? '{\n  "kty": "RSA",\n  "d": "...",\n  "n": "..."\n}' : '-----BEGIN RSA PRIVATE KEY-----...'}
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

  const renderSignatureStatus = () => {
    if (algorithm === 'none') {
      return <span className="text-orange-500"><i className="pi pi-exclamation-triangle mr-1"></i>Unsecured (None)</span>;
    }
    if (isSignatureValid) {
      return <span className="text-green-500"><i className="pi pi-check-circle mr-1"></i>Signature Verified</span>;
    }
    return <span className="text-red-500"><i className="pi pi-times-circle mr-1"></i>Invalid Signature</span>;
  };

  return (
    <div className="flex justify-content-center p-4">
      <div className="surface-card p-5 shadow-3 border-round w-full max-w-7xl">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-4 gap-3 md:gap-0">
          <div className="flex align-items-center">
            <Button icon="pi pi-arrow-left" text rounded severity="secondary" onClick={() => navigate('/')} className="mr-3" />
            <h2 className="m-0 text-2xl md:text-3xl font-bold flex align-items-center">
              <i className="pi pi-shield mr-3 text-pink-500" style={{ fontSize: '2rem' }}></i>
              <span>JWT Encoder / Decoder</span>
            </h2>
          </div>
          <Button label="Reset Defaults" icon="pi pi-refresh" outlined severity="secondary" onClick={handleReset} className="align-self-start md:align-self-auto" />
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
                    {renderSignatureStatus()}
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
