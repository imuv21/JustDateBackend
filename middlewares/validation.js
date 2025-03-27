import { check, body } from "express-validator";

const signupValidator = [
    check("firstName").not().isEmpty()
        .withMessage("First name is required!").isLength({ max: 50 })
        .withMessage("First name must not exceed 50 characters!"),
    check("lastName").not().isEmpty()
        .withMessage("Last name is required!").isLength({ max: 50 })
        .withMessage("Last name must not exceed 50 characters!"),
    check("email")
        .notEmpty().withMessage("Email is required!")
        .isEmail().withMessage("Invalid email address!")
        .normalizeEmail({ gmail_remove_dots: true }),
    check("password")
        .notEmpty().withMessage("Password is required!")
        .isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        }).withMessage("Password must contain at least 8 characters, one uppercase, one lowercase letter, one number, and one special character!")
        .isLength({ max: 50 }).withMessage("Password must not exceed 50 characters!"),
    body("confirmPassword")
        .notEmpty().withMessage("Confirm Password is required!")
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("Passwords do not match!");
            }
            return true;
        })
];

const loginValidator = [
    check("email")
        .notEmpty().withMessage("Email is required!")
        .isEmail().withMessage("Invalid email address!")
        .normalizeEmail({ gmail_remove_dots: true }),
    check("password")
        .notEmpty().withMessage("Password is required!")
        .isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        }).withMessage("Password must contain at least 8 characters, one uppercase, one lowercase letter, one number, and one special character!")
        .isLength({ max: 50 }).withMessage("Password must not exceed 50 characters!")
];

const forgotPasswordValidator = [
    check("email")
        .notEmpty().withMessage("Email is required!")
        .isEmail().withMessage("Invalid email address!")
        .normalizeEmail({ gmail_remove_dots: true }),
];

const verifyPasswordOtpValidator = [
    check("otp")
        .notEmpty().withMessage("OTP is required!")
        .isNumeric().withMessage("OTP must be a number!")
        .isLength({ min: 6, max: 6 }).withMessage("OTP must be exactly 6 digits long!"),
    check("newPassword")
        .notEmpty().withMessage("Password is required!")
        .isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        }).withMessage("Password must contain at least 8 characters, one uppercase, one lowercase letter, one number, and one special character!")
        .isLength({ max: 50 }).withMessage("Password must not exceed 50 characters!"),
    body("confirmNewPassword")
        .notEmpty().withMessage("Confirm Password is required!")
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error("Passwords do not match!");
            }
            return true;
        })
];

const updateProfileValidator = [
    check("interests").not().isEmpty()
        .withMessage("Interests are required!").isLength({ max: 70 })
        .withMessage("Interests must not exceed 100 characters!"),
    check("links.imdb.url").optional({ checkFalsy: true }).matches(/^(https?:\/\/)?(www\.)?imdb\.com\/.*/i)
        .withMessage("Invalid IMDb URL format"),
    check("links.insta.url").optional({ checkFalsy: true }).matches(/^(https?:\/\/)?(www\.)?instagram\.com\/.*/i)
        .withMessage("Invalid Instagram URL format"),
    check("links.twitter.url").optional({ checkFalsy: true }).matches(/^(https?:\/\/)?(www\.)?x\.com\/.*/i)
        .withMessage("Invalid Twitter URL format"),
    check("links.spotify.url").optional({ checkFalsy: true }).matches(/^(https?:\/\/)?(www\.)?spotify\.com\/.*/i)
        .withMessage("Invalid Spotify URL format"),
];

const detailsValidator = [

    check("age").not().isEmpty().withMessage("Age is required!").isInt({ min: 18 }).withMessage("Go watch pogo kiddo!"),

    check("gender").not().isEmpty().withMessage("Gender is required!").isIn(['Male', 'Female']).withMessage("Gender must be either Male or Female!"),

    check("height").isFloat({ min: 20 }).withMessage("Please! Your are not that short!"),

    check("location").not().isEmpty().withMessage("Location is required!"),

    check("bodyType").not().isEmpty().withMessage("Body type is required!").isIn(['Skinny', 'Average', 'Curvy', 'Healthy']).withMessage("Invalid input!"),

    check("drinking").not().isEmpty().withMessage("Drinking is required!").isIn(['Yes', 'No']).withMessage("Invalid input!"),

    check("smoking").not().isEmpty().withMessage("Smoking is required!").isIn(['Yes', 'No']).withMessage("Invalid input!"),

    check("relationshipStatus").not().isEmpty().withMessage("Relationship status is required!").isIn(['Single', 'Separated', 'Widowed']).withMessage("Invalid input!"),
];

export { signupValidator, loginValidator, forgotPasswordValidator, verifyPasswordOtpValidator, updateProfileValidator, detailsValidator };