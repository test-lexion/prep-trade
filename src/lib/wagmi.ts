import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID'; // Get this from https://cloud.walletconnect.com

if (!projectId) {
  console.error("You need to provide a WalletConnect Project ID");
}

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia], // Add the chains you want to support
  connectors: [
    injected(), // For browser wallets like MetaMask
    walletConnect({ projectId }), // For mobile wallets via QR code
  ],
  transports: {
    [mainnet.id]: http(), // Uses public JSON-RPC endpoints
    [sepolia.id]: http(),
  },
});
