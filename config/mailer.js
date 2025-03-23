const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // o cualquier otro servicio
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendVerificationEmail = (email, token) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verifica tu correo electrónico',
        html: `<p>Por favor, haz clic en el siguiente enlace para verificar tu correo electrónico:</p>
               <a href="http://localhost:5001/verify/${token}">Verificar correo</a>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error enviando el correo:', error);
        } else {
            console.log('Correo enviado:', info.response);
        }
    });
};

module.exports = { sendVerificationEmail };