pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                bat 'python -m pip install pytest'
            }
        }

        stage('Test') {
            steps {
                bat 'python -m pytest'
            }
        }
    }
}
