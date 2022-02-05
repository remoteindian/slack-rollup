var ghpages = require('gh-pages');

ghpages.publish(
    'public',
    {
        branch: 'gh-pages',
        silent: true,
        repo: 'https://github.com/remoteindian/slack-rollup.git',
        user: {
            name: 'Abhishek Bose',
            email: 'abhishekbose87@gmail.com'
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)