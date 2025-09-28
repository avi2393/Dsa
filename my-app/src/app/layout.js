import './globals.css'

export const metadata = {
  title: 'TSP Visualizer',
  description: 'Traveling Salesman Problem Visualizer by create next app',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-900">{children}</body>
    </html>
  )
};