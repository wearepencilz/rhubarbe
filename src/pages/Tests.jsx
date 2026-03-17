import { Link } from 'react-router-dom'

const Tests = () => {
  const tests = [
    {
      name: 'Link Decoration Test',
      path: '/link-test',
      description: 'Test the SVG link decoration beneath menu items'
    },
    {
      name: 'Mega Menu Test',
      path: '/mega-menu-test',
      description: 'Test the mega menu dropdown positioning and styling'
    },
    {
      name: 'Test Stack',
      path: '/test-stack',
      description: 'Test the stacked project cards component'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2">Test Pages</h1>
          <p className="text-gray-600 mb-6">
            Collection of test pages for development and debugging
          </p>
          
          <div className="space-y-4">
            {tests.map((test) => (
              <Link
                key={test.path}
                to={test.path}
                className="block p-6 border border-gray-200 rounded-lg hover:border-gray-400 hover:shadow-md transition-all"
              >
                <h2 className="text-xl font-semibold mb-2">{test.name}</h2>
                <p className="text-gray-600 text-sm">{test.description}</p>
                <span className="text-blue-600 text-sm mt-2 inline-block">
                  View test →
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This page is only visible in local development. 
            The link in the footer will not appear in production.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Tests
