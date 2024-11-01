import { check, body } from "express-validator";

const signupValidator = [
    check("firstName").not().isEmpty()
        .withMessage("First name is required"),
    check("lastName").not().isEmpty()
        .withMessage("Last name is required"),
    check("email").isEmail()
        .normalizeEmail({
            gmail_remove_dots: true
        }).withMessage("Invalid email address"),
    check("password").isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }).withMessage("Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"),
    body("confirmPassword").custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Passwords do not match");
        }
        return true;
    })
];

const loginValidator = [
    check("email").isEmail()
        .normalizeEmail({
            gmail_remove_dots: true
        }).withMessage("Invalid email address"),
    check("password").isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }).withMessage("Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character")
];

const updateProfileValidator = [
    check("interests").not().isEmpty().withMessage("Interests are required"),
    check("links.imdb.url").optional({ checkFalsy: true }).matches(/^(https?:\/\/)?(www\.)?imdb\.com\/.*/i)
        .withMessage("Invalid IMDb URL format"),
    check("links.insta.url").optional({ checkFalsy: true }).matches(/^(https?:\/\/)?(www\.)?instagram\.com\/.*/i)
        .withMessage("Invalid Instagram URL format"),
    check("links.twitter.url").optional({ checkFalsy: true }).matches(/^(https?:\/\/)?(www\.)?x\.com\/.*/i)
        .withMessage("Invalid Twitter URL format"),
    check("links.spotify.url").optional({ checkFalsy: true }).matches(/^(https?:\/\/)?(www\.)?spotify\.com\/.*/i)
        .withMessage("Invalid Spotify URL format"),
];

export { signupValidator, loginValidator, updateProfileValidator };